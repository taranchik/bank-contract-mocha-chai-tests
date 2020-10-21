const Migrations = artifacts.require("Migrations");
const Bank = artifacts.require("Bank");

module.exports = function(deployer) {
  deployer.deploy(Bank);
  deployer.deploy(Migrations);
};
