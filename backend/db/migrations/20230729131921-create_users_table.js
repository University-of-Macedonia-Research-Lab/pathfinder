"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("users", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER.UNSIGNED,
      },
      email: {
        allowNull: false,
        type: Sequelize.STRING(128),
      },
      provider: {
        allowNull: false,
        type: Sequelize.STRING(128),
      },
      provider_id: {
        allowNull: false,
        type: Sequelize.STRING(128),
      },
      display_name: {
        allowNull: false,
        type: Sequelize.STRING(128),
      },
      image_url: {
        allowNull: true,
        type: Sequelize.STRING(1024),
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("users");
  },
};
