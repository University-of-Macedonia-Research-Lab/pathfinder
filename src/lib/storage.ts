/**
 * S3-compatible object storage (Digital Ocean Spaces in production).
 *
 * The flow is browser-direct: the API route hands back a pre-signed PUT
 * URL plus the final public URL, the browser PUTs the bytes straight to
 * the bucket, and we never touch the bytes server-side. This avoids
 * Next.js's server-action body limit (1 MB) and the API route's request
 * limit (we'd otherwise cap around 8 MB).
 *
 * Falls back to null when env isn't configured, so callers can transparently
 * route uploads to the FloorAsset DB table in dev environments without
 * Spaces credentials.
 */
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type SpacesConfig = {
  region: string;
  endpoint: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicEndpoint?: string;
  folder?: string;
};

let cached: { cfg: SpacesConfig; client: S3Client } | null | undefined;

export function spacesConfig(): SpacesConfig | null {
  if (cached !== undefined) return cached?.cfg ?? null;
  const env = process.env;
  if (
    !env.DO_SPACES_REGION ||
    !env.DO_SPACES_ENDPOINT ||
    !env.DO_SPACES_BUCKET ||
    !env.DO_SPACES_KEY ||
    !env.DO_SPACES_SECRET
  ) {
    cached = null;
    return null;
  }
  const cfg: SpacesConfig = {
    region: env.DO_SPACES_REGION,
    endpoint: env.DO_SPACES_ENDPOINT,
    bucket: env.DO_SPACES_BUCKET,
    accessKeyId: env.DO_SPACES_KEY,
    secretAccessKey: env.DO_SPACES_SECRET,
    publicEndpoint: env.NEXT_PUBLIC_DO_SPACES_ENDPOINT,
    folder: env.NEXT_PUBLIC_DO_SPACES_FOLDER,
  };
  cached = {
    cfg,
    client: new S3Client({
      region: cfg.region,
      endpoint: cfg.endpoint,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey: cfg.secretAccessKey,
      },
    }),
  };
  return cfg;
}

function sanitizeName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "file";
}

function buildPublicUrl(cfg: SpacesConfig, key: string): string {
  if (cfg.publicEndpoint) {
    return `${cfg.publicEndpoint.replace(/\/$/, "")}/${key}`;
  }
  // Spaces default URL shape: https://<bucket>.<region>.digitaloceanspaces.com/<key>
  const u = new URL(cfg.endpoint);
  return `${u.protocol}//${cfg.bucket}.${u.host}/${key}`;
}

export type PresignedPut = {
  key: string;
  signedUrl: string;
  publicUrl: string;
  /** Headers the browser MUST include on the PUT so the signature matches.
   *  Spaces requires `x-amz-acl: public-read` when the presigner signs ACL
   *  into the SigV4 request — leaving it off makes the bucket reject the
   *  upload with a signature mismatch and the rendered URL ends up 403. */
  requiredHeaders: Record<string, string>;
};

/** Generate a pre-signed PUT URL the browser can upload directly to. The
 *  resulting object is public-read so the published map can reference it
 *  without exchanging additional credentials. */
export async function presignUpload(input: {
  fileName: string;
  fileType: string;
  /** Relative path under the configured folder. Each piece is joined with
   *  "/"; the helper appends a timestamp + sanitised filename to keep the
   *  key unique. */
  pathParts: string[];
  expiresInSeconds?: number;
}): Promise<PresignedPut | null> {
  spacesConfig(); // populate cache
  if (!cached) return null;
  const { cfg, client } = cached;

  const folder = cfg.folder?.replace(/^\/|\/$/g, "");
  const safeName = sanitizeName(input.fileName);
  const prefix = [folder, ...input.pathParts]
    .filter(Boolean)
    .map((p) => String(p).replace(/^\/|\/$/g, ""))
    .join("/");
  const key = `${prefix}/${Date.now()}-${safeName}`;

  const acl = "public-read";
  const cmd = new PutObjectCommand({
    Bucket: cfg.bucket,
    Key: key,
    ContentType: input.fileType,
    ACL: acl,
  });
  const signedUrl = await getSignedUrl(client, cmd, {
    expiresIn: input.expiresInSeconds ?? 3600,
  });
  return {
    key,
    signedUrl,
    publicUrl: buildPublicUrl(cfg, key),
    requiredHeaders: {
      "content-type": input.fileType,
      "x-amz-acl": acl,
    },
  };
}
