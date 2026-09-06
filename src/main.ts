import {Game} from './game';

const game = new Game();

addEventListener('resize', () => game.resize());
game.resize();
requestAnimationFrame(game.frame);
