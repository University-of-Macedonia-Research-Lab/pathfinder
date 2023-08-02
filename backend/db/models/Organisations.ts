import {
	Model, Table, Column, DataType, Index, Sequelize, ForeignKey 
} from "sequelize-typescript";

export interface organisationsAttributes {
    id?: string;
    name?: string;
    friendlyName?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

@Table({
	tableName: "organisations",
	schema: "public",
	timestamps: false 
})
export class organisations extends Model<organisationsAttributes, organisationsAttributes> implements organisationsAttributes {

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
    	type: DataType.DATE,
    	defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") 
    })
    	createdAt?: Date;

    @Column({
    	allowNull: true,
    	type: DataType.DATE,
    	defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") 
    })
    	updatedAt?: Date;

}