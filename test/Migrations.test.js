console.log('running Migrations.test.js');

var Migrations = artifacts.require("Migrations");

contract('Migrations', function(accounts) 
{
    let instance;

    // beforeEach('setup contract for each test', async () => {
    //     instance = await Migrations.deployed();
    //   });

    // it('should return string - "Hello World!"', function() {
    //         instance.getString.call().then(function(ret) {
    //             assert.equal("Hello World!", ret);
    //         });
    // });

    // it('should work', async() => {
    //     let ret = await instance.getString.call();
    //     assert.equal(ret, "Hello World!");
    // });
});