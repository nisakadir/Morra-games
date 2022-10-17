//frontend
//code always in javascript

import { loadStdlib } from "@reach-sh/stdlib";
import * as backend from './build/index.main.mjs';
const stdlib = loadStdlib();

//create new test account
const startingBalance = stdlib.parseCurrency(100);
const accAlice = await stdlib.newTestAccount(startingBalance);
const accBob = await stdlib.newTestAccount(startingBalance);

//4 decimal places
const fmt = (x) => stdlib.formatCurrency(x,4);
const getBalance = async (who) => fmt(await stdlib.balanceOf(who));
const beforeAlice = await getBalance(accAlice);
const beforeBob = await getBalance(accBob);

//contract player to attch with backend
const ctcAlice = accAlice.contract(backend);
const ctcBob = accBob.contract(backend, ctcAlice.getInfo());

const HAND = [0, 1, 2, 3, 4, 5];
const GUESS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];  
const OUTCOME = ['Bob wins', 'Draw', 'Alice wins'];

const Player = (Who) => ({
    ...stdlib.hasRandom,
    getHand: async () => {
        const hand = Math.floor(Math.random() * 3);
        console.log(`${Who} played ${HAND[hand]}`)
        if(Math.random() <= 0.01){
            for(let i = 0; i < 10; i++){
                console.log(` ${Who} takes their sweet time sending it back`);
                await stdlib.wait(1);
            }
        }
        return hand;
    },

    getGuess:  async (hand) => {
        // guess should be greater than or equal to number of fingers thrown
        // const guess= Math.floor(Math.random() * 3);
         const guess= Math.floor(Math.random() * 6) + HAND[hand];
        // occassional timeout
         if ( Math.random() <= 0.01 ) {
           for ( let i = 0; i < 10; i++ ) {
             console.log(`  ${Who} takes their sweet time sending it back...`);
             await stdlib.wait(1);
           }
         }
         console.log(`${Who} guessed total of ${guess}`);   
         return guess;
       },

    seeOutcome: (outcome) => {
        console.log(`${Who} saw outcome ${OUTCOME[outcome]}`);
    },
    informTimeout: () => {
        console.log(`${Who} oberved a timeout`);
    },
})

await Promise.all([
    ctcAlice.p.Alice({
        //Alice interact object here
        ...Player('Alice'),
        wager: stdlib.parseCurrency(5),
        deadline: 10,
    }),
    ctcBob.p.Bob({
        //Bob interact object here
        ...Player('Bob'),
        acceptWager: (amt) => {
                console.log(`Bob accepts the wager of ${fmt(amt)}.`);
        },
    }),
]);

const afterAlice = await getBalance(accAlice);
const afterBob = await getBalance(accBob);

console.log(`Alice went from ${beforeAlice} to ${afterAlice}`);
console.log(`Bob went from ${beforeBob} to ${afterBob}`);