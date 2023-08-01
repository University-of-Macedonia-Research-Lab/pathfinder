import {
	Model, Table, Column, DataType, Index, Sequelize, ForeignKey 
} from "sequelize-typescript";

export interface OrganisationsAttributes {
    id?: string;
    name?: string;
    friendlyName?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

@Table({
	tableName: "Organisations",
	schema: "public",
	timestamps: false 
})
export class Organisations extends Model<OrganisationsAttributes, OrganisationsAttributes> implements OrganisationsAttributes {

    @Column({
  primaryKey: true,
  type: DataType.UUID,
  defaultValue: DataType.UUIDV4,
})
id!: string;

    @Column({
    	allowNull: true,
    	type: DataType.STRING(255) 
    })
    	name?: string;

    @Column({
    	allowNull: true,
    	type: DataType.STRING(255) 
    })
    	friendlyName?: string;

    @Column({
    	allowNull: true,
    	type: DataType.DATE 
    })
    	createdAt?: Date;

    @Column({
    	allowNull: true,
    	type: DataType.DATE 
    })
    	updatedAt?: Date;

}