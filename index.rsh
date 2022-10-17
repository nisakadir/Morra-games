'reach 0.1';

const[gameOutcome, A_WINS, B_WINS, DRAW] = makeEnum(3);

const winner = (playHandA, playHandB, gHandA, gHandB)=> {
    if(gHandA == gHandB){
        return DRAW;
    }
    else{
        if(gHandA == (playHandA + playHandB)){
            return A_WINS;
        }
        else{
            if(gHandB == (playHandA + playHandB)){
                return B_WINS;
            }
            else{
                return DRAW;
            }
        }
    }
};

assert(winner(0,4,0,4)== B_WINS);
assert(winner(4,0,4,0)== A_WINS);
assert(winner(0,1,0,4)== DRAW);
assert(winner(5,5,5,5)== DRAW);

forall(UInt, a =>
    forall(UInt, b =>
    forall(UInt, c =>
    forall(UInt, d =>
    assert(gameOutcome(winner(a,b,c,d)))))));

    forall(UInt, a =>
        forall(UInt, b =>
        forall(UInt, c =>
        assert(winner(a,b,c,c) == DRAW))));

const Shared = {
    ...hasRandom,
    getHand: Fun([],UInt),
    getGuess: Fun([],UInt),
    seeOutcome: Fun([UInt], Null),
    informTimeout: Fun([],Null),
};

export const main = Reach.App(() =>{
    const Alice = Participant('Alice', {
        ...Shared,
        wager: UInt,
        deadline: UInt,
    });
    const Bob = Participant('Bob',{
        ...Shared,
        acceptWager: Fun([UInt],Null),
    });
    init();

    const informTimeout = () => {
        each([Alice,Bob], () => {
            interact.informTimeout();
        });
    };

    Alice.only(() => {
        const amt = declassify(interact.wager);
        const time = declassify(interact.deadline);
    });
    Alice.publish(amt,time)
     .pay(amt);
    commit();

    Bob.interact.acceptWager(amt);
    Bob.pay(amt)
     .timeout(relativeTime(time), () => closeTo(Alice, informTimeout));
     
    var outcome = DRAW;
    invariant(balance() == 2 * amt && gameOutcome(outcome));
    while(outcome == DRAW){
        commit();

        Alice.only(() => {
            const _playHandA = interact.getHand();
            const _gHandA = interact.getGuess();

            const [_commitA,_saltA] = makeCommitment(interact,_playHandA);
            const commitA = declassify(_commitA);
            const[_guessCommitA, _guessSaltA] = makeCommitment(interact,_gHandA);
            const guessCommitA = declassify(_guessCommitA);
        });

        Alice.publish(commitA, guessCommitA)
         .timeout(relativeTime(time), () => closeTo(Bob, informTimeout));
        commit();

        unknowable(Bob, Alice(_playHandA, _saltA));
        unknowable(Bob, Alice(_gHandA, _guessSaltA));

        Bob.only(() =>{
            const _playHandB = interact.getHand();
            const _gHandB = interact.getGuess();
            const playHandB = declassify(_playHandB);
            const gHandB = declassify(_gHandB);
        });

        Bob.publish(playHandB,gHandB)
         .timeout(relativeTime(time), () => closeTo(Alice, informTimeout));
        commit();

        Alice.only(() => {
            const [saltA, playHandA] = declassify([_saltA, _playHandA]);
            const [guessSaltA, gHandA] = declassify([_guessSaltA,_gHandA]);
        })

        Alice.publish(saltA, playHandA, guessSaltA, gHandA)
         .timeout(relativeTime(time), () => closeTo(Bob, informTimeout));

        checkCommitment(commitA, saltA, playHandA);
        checkCommitment(guessCommitA, guessSaltA, gHandA);


      outcome = winner(playHandA, playHandB, gHandA, gHandB);
      continue;

    }//end of while loop
    assert(outcome == A_WINS || outcome == B_WINS);
    transfer(2 * amt).to(outcome == A_WINS ? Alice : Bob);
    commit();

    each([Alice, Bob], () => {
        interact.seeOutcome(outcome);
    });
    exit();
});



