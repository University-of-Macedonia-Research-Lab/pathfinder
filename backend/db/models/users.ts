import {
  Model,
  Table,
  Column,
  DataType,
  Index,
  Sequelize,
  ForeignKey,
} from "sequelize-typescript";

export interface usersAttributes {
  id?: number;
  email?: string;
  provider?: string;
  providerId?: string;
  displayName?: string;
  imageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

@Table({
  tableName: "users",
  schema: "public",
  timestamps: false,
})
export class users
  extends Model<usersAttributes, usersAttributes>
  implements usersAttributes
{
  @Column({
    primaryKey: true,
    autoIncrement: true,
    type: DataType.INTEGER,
    defaultValue: Sequelize.literal("nextval('users_id_seq'::regclass)"),
  })
  id?: number;

  @Column({
    allowNull: true,
    type: DataType.STRING(128),
  })
  email?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(128),
  })
  provider?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(128),
  })
  providerId?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(128),
  })
  displayName?: string;

  @Column({
    allowNull: true,
    type: DataType.STRING(1024),
  })
  imageUrl?: string;

  @Column({
    allowNull: true,
    type: DataType.DATE,
  })
  createdAt?: Date;

  @Column({
    allowNull: true,
    type: DataType.DATE,
  })
  updatedAt?: Date;
}
