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
      providerId: {
        allowNull: false,
        type: Sequelize.STRING(128),
      },
      displayName: {
        allowNull: false,
        type: Sequelize.STRING(128),
      },
      imageUrl: {
        allowNull: true,
        type: Sequelize.STRING(1024),
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("users");
  },
};
