import { organisations, organisationsAttributes } from "../../db/models";

export const createOrganisation = async (
  organisationData: organisationsAttributes
): Promise<organisations> => {
  return organisations.create(organisationData);
};

export const getOrganisationById = async (
  id: string
): Promise<organisations | null> => {
  return organisations.findByPk(id);
};

export const getOrganisations = async (): Promise<organisations[]> => {
  return organisations.findAll();
};

export const updateOrganisation = async (
  id: string,
  organisationData: organisationsAttributes
): Promise<organisations | null> => {
  await organisations.update(organisationData, { where: { id } });
  return organisations.findByPk(id);
};
