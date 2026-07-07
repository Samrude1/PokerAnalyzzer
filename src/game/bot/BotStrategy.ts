import { Player } from '../types';
import { PokerGame } from '../PokerGame';

export interface BotAction {
    action: 'fold' | 'check' | 'call' | 'raise';
    amount?: number;
}

export interface BotStrategy {
    decidePreFlop(bot: Player, game: PokerGame, callCost: number, canCheck: boolean): BotAction;
    decidePostFlop(bot: Player, game: PokerGame, callCost: number, canCheck: boolean, pot: number): BotAction;
}
