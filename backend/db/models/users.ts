import {
	Model, Table, Column, DataType, Index, Sequelize, ForeignKey 
} from "sequelize-typescript";

export interface usersAttributes {
    id?: string;
    email?: string;
    provider?: string;
    provider_id?: string;
    display_name?: string;
    image_url?: string;
    created_at?: Date;
    updated_at?: Date;
}

@Table({
	tableName: "users",
	schema: "public",
	timestamps: false 
})
export class users extends Model<usersAttributes, usersAttributes> implements usersAttributes {

    @Column({
  primaryKey: true,
  type: DataType.UUID,
  defaultValue: DataType.UUIDV4,
})
id!: string;

    @Column({
    	allowNull: true,
    	type: DataType.STRING(128) 
    })
    	email?: string;

    @Column({
    	allowNull: true,
    	type: DataType.STRING(128) 
    })
    	provider?: string;

    @Column({
    	allowNull: true,
    	type: DataType.STRING(128) 
    })
    	provider_id?: string;

    @Column({
    	allowNull: true,
    	type: DataType.STRING(128) 
    })
    	display_name?: string;

    @Column({
    	allowNull: true,
    	type: DataType.STRING(1024) 
    })
    	image_url?: string;

    @Column({
    	allowNull: true,
    	type: DataType.DATE,
    	defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") 
    })
    	created_at?: Date;

    @Column({
    	allowNull: true,
    	type: DataType.DATE,
    	defaultValue: Sequelize.literal("CURRENT_TIMESTAMP") 
    })
    	updated_at?: Date;

}