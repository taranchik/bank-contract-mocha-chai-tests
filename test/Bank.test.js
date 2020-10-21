console.log('running Bank.test.js');

var Bank = artifacts.require("Bank");

contract('Bank', function(accounts)
{
    let instance;
    let borrowers = [ accounts[0], accounts[1], accounts[2] ];
    let guarantors = [ accounts[3], accounts[4], accounts[5] ];
    let lenders = [ accounts[6], accounts[7], accounts[8] ];

    beforeEach("Deploy contract", async() => { 
      instance = await Bank.deployed();
    });

    afterEach("Destruct contract", async() => { 
      instance = null;
    });

    describe("Testing of possible functionality", function() {
      it("borrower should make request for a loan", async() => 
      {
        // setup
        let beforeLoansCount, afterLoansCount;

        // exercise
        beforeLoansCount = await instance.loansCount();
        await instance.requestLoan(3, 31, 5, { from: borrowers[0] });
        afterLoansCount = await instance.loansCount();

        // verify
        assert(beforeLoansCount.toNumber() < afterLoansCount.toNumber());
      });

      it("guarantor should provide guarantee for a loan", async() => 
      {
        // setup
        let beforeGuaranteesCount, afterGuaranteesCount;
        let etherBorrow;
        let index = 0;

        // exercise
        beforeGuaranteesCount = await instance.guaranteesCount();
        etherBorrow = await instance.loans(index.toString()).then(result => { return result.etherBorrow.toNumber() });
        await instance.provideGuarantee(index, 3, { from: guarantors[0], gas: 200000, value: etherBorrow });
        afterGuaranteesCount = await instance.guaranteesCount();

        // verify
        assert(beforeGuaranteesCount.toNumber() < afterGuaranteesCount.toNumber());
      });

      it("borrower should reject the guarantee for a loan", async() => 
      {
        // setup
        let _isGuaranteeProvided;
        let index = 0;

        // exercise
        await instance.handleGuarantee(index, false, { from: borrowers[0] });
        _isGuaranteeProvided = await instance.loans(index.toString()).then(result => { return result._isGuaranteeProvided });
        
        // verify
        assert(!_isGuaranteeProvided);
      });

      it("another guarantor should provide guarantee for a loan with another interest", async() => 
      {
        // setup
        let beforeGuaranteesCount, afterGuaranteesCount;
        let etherBorrow;
        let index = 0;

        // exercise
        beforeGuaranteesCount = await instance.guaranteesCount();
        etherBorrow = await instance.loans(index.toString()).then(result => { return result.etherBorrow.toNumber() });
        await instance.provideGuarantee(index, 2, { from: guarantors[1], gas: 200000, value: etherBorrow });
        afterGuaranteesCount = await instance.guaranteesCount();

        // verify
        assert(beforeGuaranteesCount.toNumber() < afterGuaranteesCount.toNumber());
      });

      it("borrower should accept the guarantee for a loan", async() => 
      {
        // setup
        let _isGuaranteeProvided;
        let index = 0;

        // exercise
        await instance.handleGuarantee(index, true, { from: borrowers[0] });
        _isGuaranteeProvided = await instance.loans(index.toString()).then(result => { return result._isGuaranteeProvided });
        
        // verify
        assert(_isGuaranteeProvided);
      });

      it("lender should provide the loan for the loanee", async() => 
      {
        // setup
        let _isLoanProvided;
        let index = 0;

        // exercise
        await instance.provideLoanForLoanee(index, { from: lenders[0], gas: 200000, value: 3 });
        _isLoanProvided = await instance.loans(index.toString()).then(result => { return result._isLoanProvided });
        
        // verify
        assert(_isLoanProvided);
      });

      it("lender should receive information about the loan", async() => 
      {
        // setup
        let _loanInfo;
        let index = 0;

        // exercise
        let expectedResult = {
          '0': await instance.loansCount(),
          '1': await instance.loans(index.toString()).then(result => { return result._isGuaranteeProvided }),
          '2': parseInt(await instance.loans(index.toString()).then(result => { return result.etherBorrow }) *
          await instance.loans(index.toString()).then(result => { return result.etherInterest / 100 })),
          '3': await instance.guarantees(index.toString()).then(result => { return result.guarantor.toString() })
        };

        _loanInfo = await instance.getLoansInfo(index, { from: lenders[0] });
        _loanInfo['2'] = _loanInfo['2'].toNumber();

        // verify
        expect(_loanInfo).to.eql(expectedResult);
      });

      it("lender should check is borrower transfer ether at time", async() => 
      {
        // setup
        let _isLoanExist;
        let index = 0;

        // exercise
        await instance.isBorrowerTransferEtherAtTime(index, { from: lenders[0] });
        _isLoanExist = await instance.loans(index.toString()).then(result => { return result._isLoanExist });

        // verify
        assert(_isLoanExist);
      });

      it("borrower should pay back loan", async() => 
      {
        // setup
        let beforeLoansCount, afterLoansCount;
        let beforeGuaranteesCount, afterGuaranteesCount;
        let amount;
        let index = 0;

        // exercise
        etherBorrow = await instance.loans(index.toString()).then(result => { return result.etherBorrow.toNumber() });
        loanEtherInterest = await instance.loans(index.toString()).then(result => { return result.etherInterest.toNumber() });
        guaranteeEtherInterest = await instance.guarantees(index.toString()).then(result => { return result.etherInterest.toNumber() });
        amount = parseInt((etherBorrow + etherBorrow * guaranteeEtherInterest / 100) 
                  + (etherBorrow * loanEtherInterest / 100));

        beforeLoansCount = await instance.loansCount();
        beforeGuaranteesCount = await instance.guaranteesCount();

        await instance.payBackLoan(0, { from: borrowers[0], gas: 200000, value: amount });
        afterLoansCount = await instance.loansCount();
        afterGuaranteesCount = await instance.guaranteesCount();

        // verify
        assert(beforeLoansCount.toNumber() > afterLoansCount.toNumber());
        assert(beforeGuaranteesCount.toNumber() > afterGuaranteesCount.toNumber());
      });
    });

    describe("Testing of unpossible functionality", function() {
      describe("Request loan testing", function() {
        it("borrower should make request for a loan", async() => 
        {
          // setup
          let beforeLoansCount, afterLoansCount;

          // exercise
          beforeLoansCount = await instance.loansCount();
          await instance.requestLoan(3, 31, 5, { from: borrowers[0] });
          afterLoansCount = await instance.loansCount();

          // verify
          assert(beforeLoansCount.toNumber() < afterLoansCount.toNumber());
        })
      });

      describe("Provide guarantee testing", function() {
        it("borrower tries to provide guarantee to himself", async() => 
        {
          // setup
          let beforeGuaranteesCount, afterGuaranteesCount;
          let index = 0;

          // exercise
          beforeGuaranteesCount = await instance.guaranteesCount();
          try{
              await instance.provideGuarantee(index, 3, { from: borrowers[0] });
          } catch(error) {
            // verify
            assert(error, "The borrower can't provide a guarantee to himself");
          }
          afterGuaranteesCount = await instance.guaranteesCount();

            // verify
            assert(beforeGuaranteesCount.toNumber() == afterGuaranteesCount.toNumber());
        });

        it("guarantor tries to provide a guarantee for a non-existent loan", async() => 
        {
          // setup
          let beforeGuaranteesCount, afterGuaranteesCount;
          let index = 1;

          // exercise
          beforeGuaranteesCount = await instance.guaranteesCount();
          try{
              await instance.provideGuarantee(index, 3, { from: guarantors[0] });
          } catch(error) {
            // verify
            assert(error, "This index does not exist");
          }
          afterGuaranteesCount = await instance.guaranteesCount();

            // verify
            assert(beforeGuaranteesCount.toNumber() == afterGuaranteesCount.toNumber());
        });

        it("lender tries to provide a guarantee for the loan", async() => 
        {
          // setup
          let beforeGuaranteesCount, afterGuaranteesCount;
          let index = 0;

          // exercise
          beforeGuaranteesCount = await instance.guaranteesCount();
          try{
              await instance.provideGuarantee(index, 3, { from: lenders[0] });
          } catch(error) {
            // verify
            assert(error, "The lender can't provide guarantee for the loan");
          }
          afterGuaranteesCount = await instance.guaranteesCount();

          // verify
          assert(beforeGuaranteesCount.toNumber() == afterGuaranteesCount.toNumber());
        });

        it("guarantor tries to provide a guarantee for loan, which already have a guarantee", async() => 
        {
          // setup
          let beforeGuaranteesCount, afterGuaranteesCount;
          let index = 0;

          // exercise
          beforeGuaranteesCount = await instance.guaranteesCount();
          try{
              await instance.provideGuarantee(index, 3, { from: guarantors[0] });
              await instance.provideGuarantee(index, 5, { from: guarantors[0] });
          } catch(error) {
            // verify
            assert(error, "This loan already has a guarantee");
          }
          afterGuaranteesCount = await instance.guaranteesCount();

            // verify
            assert(beforeGuaranteesCount.toNumber() == afterGuaranteesCount.toNumber());
        });

        it("guarantor tries to provide a guarantee for loan with zero interest", async() => 
        {
          // setup
          let beforeGuaranteesCount, afterGuaranteesCount;
          let index = 0;

          // exercise
          beforeGuaranteesCount = await instance.guaranteesCount();
          try{
              await instance.provideGuarantee(index, 0, { from: guarantors[0] });
          } catch(error) {
            // verify
            assert(error, "Too low interest");
          }
          afterGuaranteesCount = await instance.guaranteesCount();

            // verify
            assert(beforeGuaranteesCount.toNumber() == afterGuaranteesCount.toNumber());
        });

        it("guarantor tries to provide a guarantee for loan with negative interest", async() => 
        {
          // setup
          let beforeGuaranteesCount, afterGuaranteesCount;
          let index = 0;

          // exercise
          beforeGuaranteesCount = await instance.guaranteesCount();
          try{
              await instance.provideGuarantee(index, -1, { from: guarantors[0] });
          } catch(error) {
            // verify
            assert(error, "Too low interest");
          }
          afterGuaranteesCount = await instance.guaranteesCount();

            // verify
            assert(beforeGuaranteesCount.toNumber() == afterGuaranteesCount.toNumber());
        });

        it("guarantor tries to provide a guarantee for loan with insufficient ether", async() => 
        {
          // setup
          let beforeGuaranteesCount, afterGuaranteesCount;
          let etherBorrow;
          let index = 0;

          // exercise
          beforeGuaranteesCount = await instance.guaranteesCount();
          try{
              etherBorrow = await instance.loans(index.toString()).then(result => { return result.etherBorrow.toNumber() });
              etherBorrow = etherBorrow - 1;
              await instance.provideGuarantee(index, 3, { from: guarantors[0], gas: 200000, value: etherBorrow });
          } catch(error) {
            // verify
            assert(error, "You don't have enough eather to provide guarantee");
          }
          afterGuaranteesCount = await instance.guaranteesCount();

            // verify
            assert(beforeGuaranteesCount.toNumber() == afterGuaranteesCount.toNumber());
        });

        it("borrower tries to handle non-existing guarantee", async() => 
        {
          // setup
          let _isWaitingForHandling, _isGuaranteeProvided;
          let index = 0;

          // exercise
          try{
            await instance.handleGuarantee(index, true, { from: borrowers[1] });
          } catch(error) {
            // verify
            assert(error, "This guarantee does not exist");
          }
          _isGuaranteeProvided = await instance.loans(index.toString()).then(result => { return result._isGuaranteeProvided });
          _isWaitingForHandling = await instance.guarantees(index.toString()).then(result => { return result._isWaitingForHandling });

          // verify
          assert(!_isGuaranteeProvided);
          assert(!_isWaitingForHandling)
        });

        it("lender tries to provide a loan to borrower, but the loan doesn't have a guarantee", async() => 
        {
          // setup
          let index = 0;

          // exercise
          try{
            await instance.provideLoanForLoanee(index, { from: lenders[0] });
          } catch(error) {
            // verify
            assert(error, "This loan doesn't have a guarantee");
          }
        });

        it("guarantor should provide a guarantee for loan", async() => 
        {
          // setup
          let beforeGuaranteesCount, afterGuaranteesCount;
          let etherBorrow;
          let index = 0;

          // exercise
          beforeGuaranteesCount = await instance.guaranteesCount();
          etherBorrow = await instance.loans(index.toString()).then(result => { return result.etherBorrow.toNumber() });
          await instance.provideGuarantee(index, 3, { from: guarantors[0], gas: 200000, value: etherBorrow });
          afterGuaranteesCount = await instance.guaranteesCount();

          // verify
          assert(beforeGuaranteesCount.toNumber() < afterGuaranteesCount.toNumber());
        });
      });

      describe("Handle guarantee testing", function() {
        it("borrower tries handle non-existing loan", async() => 
        {
          // setup
          let index = 3;

          // exercise
          try{
            await instance.handleGuarantee(index, true, { from: borrowers[0] });
          } catch(error) {
            // verify
            assert(error, "This index does not exist");
          }
        });

        it("borrower tries to handle not own loan", async() => 
        {
          // setup
          let _isWaitingForHandling, _isGuaranteeProvided;
          let index = 0;

          // exercise
          try{
            await instance.handleGuarantee(index, true, { from: borrowers[1] });
          } catch(error) {
            // verify
            assert(error, "This is not your loan");
          }
          _isGuaranteeProvided = await instance.loans(index.toString()).then(result => { return result._isGuaranteeProvided });
          _isWaitingForHandling = await instance.guarantees(index.toString()).then(result => { return result._isWaitingForHandling });

          // verify
          assert(!_isGuaranteeProvided);
          assert(_isWaitingForHandling)
        });

        it("borrower should handle and accept the guarantee for a loan", async() => 
        {
          // setup
          let _isWaitingForHandling, _isGuaranteeProvided;
          let index = 0;

          // exercise
          await instance.handleGuarantee(index, true, { from: borrowers[0] });
          _isGuaranteeProvided = await instance.loans(index.toString()).then(result => { return result._isGuaranteeProvided });
          _isWaitingForHandling = await instance.guarantees(index.toString()).then(result => { return result._isWaitingForHandling });

          // verify
          assert(_isGuaranteeProvided);
          assert(!_isWaitingForHandling);
        });

        it("borrower tries to handle guarantee, which already handled", async() => 
        {
          // setup
          let etherBorrow;
          let index = 0;

          // exercise
          etherBorrow = await instance.loans(index.toString()).then(result => { return result.etherBorrow.toNumber() });
          try{
            await instance.handleGuarantee(index, true, { from: borrowers[0] });
          } catch(error) {
            // verify
            assert(error, "This guarantee does exist");
          }
        });

        it("lender tries to provide a guarantee for loan, which already have guarantee", async() => 
        {
          // setup
          let etherBorrow;
          let index = 0;

          // exercise
          etherBorrow = await instance.loans(index.toString()).then(result => { return result.etherBorrow.toNumber() });
          try{
            await instance.provideGuarantee(index, 3, { from: lenders[0], gas: 200000, value: etherBorrow });
          } catch(error) {
            // verify
            assert(error, "This guarantee does exist");
          }
        });
      });
      
      describe("Provide loan for the loanee testing", function() {
        it("lender tries to provide a loan for already provided loan", async() => 
        {
          // setup
          let index = 0;

          // exercise
          try{
            await instance.provideLoanForLoanee(index, { from: address(0) });
          } catch(error) {
            // verify
            assert(error, "The lender for this loan is already exist");
          }
        });

        it("borrower tries to provide a loan to himself", async() => 
        {
          // setup
          let index = 0;

          // exercise
          try{
            await instance.provideLoanForLoanee(index, { from: borrowers[0] });
          } catch(error) {
            // verify
            assert(error, "You are not a lender");
          }
        });

        it("guarantor tries to provide a loan to borrower", async() => 
        {
          // setup
          let index = 0;

          // exercise
          try{
            await instance.provideLoanForLoanee(index, { from: guarantors[0] });
          } catch(error) {
            // verify
            assert(error, "You are not a lender");
          }
        });

        it("lender tries to provide a loan for non-existing loan", async() => 
        {
          // setup
          let index = 5;

          // exercise
          try{
            await instance.provideLoanForLoanee(index, { from: address(0) });
          } catch(error) {
            // verify
            assert(error, "The lender for this loan is already exist");
          }
        });

        it("lender tries to provide a loan for loanee with insufficient ether", async() => 
        {
          // setup
          let etherBorrow;
          let index = 0;

          // exercise
          etherBorrow = await instance.loans(index.toString()).then(result => { return result.etherBorrow.toNumber() });
          try{
            await instance.provideLoanForLoanee(index, { from: lenders[0], gas: 200000, value: etherBorrow - 1 });
          } catch(error) {
            // verify
            assert(error, "You don't have enough ether");
          }
        });

        it("lender tries to check is borrower transfer ether at time, but the lender has not yet provided a loan", async() => 
        {
          // setup
          let index = 0;

          // exercise
          try{
            await instance.isBorrowerTransferEtherAtTime(index, { from: lenders[0] });
          } catch(error) {
            // verify
            assert(error, "Loan doesn't have a lender");
          }
        });

        it("borrower tries to pay back loan, but the loan was not provided", async() => 
        {
          // setup
          let etherBorrow;
          let index = 0;

          // exercise
          etherBorrow = await instance.loans(index.toString()).then(result => { return result.etherBorrow.toNumber() });
          try{
            await instance.payBackLoan(index, { from: borrowers[0], gas: 200000, value: etherBorrow });
          } catch(error) {
          // verify
          assert(error, "This loan was not provided");
          }
        });

        it("lender should provide the loan for the loanee", async() => 
        {
          // setup
          let _isLoanProvided, etherBorrow;
          let index = 0;

          // exercise
          etherBorrow = await instance.loans(index.toString()).then(result => { return result.etherBorrow.toNumber() });
          await instance.provideLoanForLoanee(index, { from: lenders[0], gas: 200000, value: etherBorrow });
          _isLoanProvided = await instance.loans(index.toString()).then(result => { return result._isLoanProvided });

          // verify
          assert(_isLoanProvided);
        });
      });

      describe("Check is borrower transfer ether at time testing", function() {
        it("guarantor tries to check is borrower transfer ether at time", async() => 
        {
          // setup
          let index = 0;

          // exercise
          try{
            await instance.isBorrowerTransferEtherAtTime(index, { from: guarantors[0] });
          } catch(error) {
            // verify
            assert(error, "You are not leander of this loan");
          }
        });

        it("lender tries to check non-existing loan, is borrower transfer ether at time", async() => 
        {
          // setup
          let index = 5;

          // exercise
          try{
            await instance.isBorrowerTransferEtherAtTime(index, { from: guarantors[0] });
          } catch(error) {
            // verify
            assert(error, "You are not leander of this loan");
          }
        });
      });

      describe("Get loan information testing", function() {
        it("an unauthorized person is trying to get loan information", async() => 
        {
          // setup
          let index = 0;

          // exercise
          try{
            await instance.getLoansInfo(index, { from: guarantor[2] });
          } catch(error) {
          // verify
          assert(error, "You are not a leander of this loan");
          }
        });

        it("lender tries to get information of the non-existing loan", async() => 
        {
          // setup
          let index = 5;

          // exercise
          try{
            await instance.getLoansInfo(index, { from: lenders[0] });
          } catch(error) {
          // verify
          assert(error, "This index does not exist");
          }
        });
      });

      describe("Pay back loan testing", function() {
        it("borrower tries to pay back non-existing loan", async() => 
        {
          // setup
          let etherBorrow;
          let index = 5;

          // exercise
          etherBorrow = await instance.loans(index.toString()).then(result => { return result.etherBorrow.toNumber() });
          try{
            await instance.payBackLoan(index, { from: borrowers[0], gas: 200000, value: etherBorrow });
          } catch(error) {
          // verify
          assert(error, "This index does not exist");
          }
        });

        it("borrower tries to pay back another's loan", async() => 
        {
          // setup
          let etherBorrow;
          let index = 0;

          // exercise
          etherBorrow = await instance.loans(index.toString()).then(result => { return result.etherBorrow.toNumber() });
          try{
            await instance.payBackLoan(index, { from: borrowers[2], gas: 200000, value: etherBorrow });
          } catch(error) {
          // verify
          assert(error, "This is not your loan");
          }
        });

        it("borrower should pay back loan", async() => 
        {
          // setup
          let beforeLoansCount, afterLoansCount;
          let beforeGuaranteesCount, afterGuaranteesCount;
          let amount;
          let index = 0;
        
          // exercise
          etherBorrow = await instance.loans(index.toString()).then(result => { return result.etherBorrow.toNumber() });
          loanEtherInterest = await instance.loans(index.toString()).then(result => { return result.etherInterest.toNumber() });
          guaranteeEtherInterest = await instance.guarantees(index.toString()).then(result => { return result.etherInterest.toNumber() });
          amount = parseInt((etherBorrow + etherBorrow * guaranteeEtherInterest / 100) 
                    + (etherBorrow * loanEtherInterest / 100));
        
          beforeLoansCount = await instance.loansCount();
          beforeGuaranteesCount = await instance.guaranteesCount();
        
          await instance.payBackLoan(0, { from: borrowers[0], gas: 200000, value: amount });
          afterLoansCount = await instance.loansCount();
          afterGuaranteesCount = await instance.guaranteesCount();
        
          // verify
          assert(beforeLoansCount.toNumber() > afterLoansCount.toNumber());
          assert(beforeGuaranteesCount.toNumber() > afterGuaranteesCount.toNumber());
        });
      });
    });
});