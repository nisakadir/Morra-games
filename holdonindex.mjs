import { loadStdlib, ask } from "@reach-sh/stdlib";
import * as backend from './build/index.main.mjs';
const stdlib = loadStdlib();

const isAlice = await ask.ask(
    `Are you Alice?`,
    ask.yesno
);
const who = isAlice ? 'Alice' : 'Bob';
console.log(`Starting Morra games! as ${who}`);

let acc = null;
const createAcc = await ask.ask(
    `Would you like to create an account? (only possible on devnet)`,
    ask.yesno
);
if(createAcc){
    acc = await stdlib.newTestAccount(stdlib.parseCurrency(1000));
}
else{
    const secret = await ask.ask(
    `What is your account secret?`,
    (x => x)
    );
    acc = await stdlib.newAccountFromSecret(secret);
}

let ctc = null;
if(isAlice){
    ctc = acc.contract(backend);
    ctc.getInfo().then((info) => {
        console.log(`The contract is deployed as = ${JSON.stringify(info)}`);});
}else{
    const info = await ask.ask(
        `Please paste the contract information: `,
        JSON.parse
    );
    ctc = acc.contract(backend, info)
}

const fmt = (x) => stdlib.formatCurrency(x,4);
const getBalance = async () => fmt(await stdlib.balanceOf(acc));

const before = await getBalance();
console.log(`Your balance is ${before}`);

const interact = {...stdlib.hasRandom };

interact.informTimeout = () => {
    console.log(`There was a timeout.`);
    process.exit(1);
};

if(isAlice){
    const amt = await ask.ask(
        `How much do you want to wager?`,
        stdlib.parseCurrency
    );
    interact.wager = amt;
    interact.deadline = { ETH: 100, ALGO: 100, CFX: 1000}[stdlib.connector];
}else{
    interact.acceptWager = async (amt) => {
        const accepted = await ask.ask(
            `Do you accept the wager of ${fmt(amt)}?`,
            ask.yesno
        );
        if(!accepted){
            process.exit(0);
        }
    };
}

/*const HAND = ['Rock', 'Paper', 'Scissors'];
const HANDS = {
    'Rock': 0, 'R': 0, 'r': 0,
    'Paper': 1, 'P': 1, 'p': 1,
    'Scissors': 2, 'S': 2, 's': 2,
};*/

const HANDS = [0, 1, 2, 3, 4, 5];
//getHand()
interact.getHand = async () => {
    const hand = await ask.ask(`What hand will you play?`, (x) =>{
        const hand = HANDS[x];
        if(hand === undefined){
            throw Error(`Not a valid hand ${hand}`);
        }
        return hand;
    });
    console.log(`You played ${HANDS[hand]}`);
    return hand;
};

/*interact.getGuess=async () => {
  // guess should be greater than or equal to number of fingers thrown
  // const guess= Math.floor(Math.random() * 3);
   const guess= Math.floor(Math.random() * 6) + HANDS[hand];
  // occassional timeout
   if ( Math.random() <= 0.01 ) {
     for ( let i = 0; i < 10; i++ ) {
       console.log(`  ${Who} takes their sweet time sending it back...`);
       await stdlib.wait(1);
     }
   }
   console.log(`${Who} guessed total of ${guess}`);   
   return guess;
 };*/
 
 const GUESS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];  
 interact.getGuess = async () => {
    const guess= await ask.ask(`Guess the hand?`, (x) =>{
        const guess = GUESS[x];
        /*if(guess === undefined){
            throw Error(`Not a valid hand ${guess}`);
        }*/
        return guess;
    });
    console.log(`You guess ${GUESS[guess]}`);
    return guess;
};

//outcome function
const OUTCOME = ['Bob wins', 'Draw', 'Alice wins'];
interact.seeOutcome = async (outcome) => {
    console.log(`The outcome is: ${OUTCOME[outcome]}`);
};

//participant
const part = isAlice ? ctc.p.Alice : ctc.p.Bob;
await part(interact);

const after = await getBalance();
console.log(`Your balance is now ${after}`);

ask.done();










