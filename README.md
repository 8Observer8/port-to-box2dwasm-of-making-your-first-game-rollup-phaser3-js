I have replaced Arcade Physics with [Box2D-WASM](https://github.com/Birch-san/box2d-wasm) in the examples of the [Making your first Phaser 3 game](https://phaser.io/tutorials/making-your-first-phaser-3-game) tutorial

[Topic on the Phaser forum](https://phaser.discourse.group/t/i-have-replaced-arcade-physics-with-box2d-wasm-in-the-examples-of-the-making-your-first-phaser-3-game-tutorial/14274)

Playground:

- [Part 01: Introduction](https://plnkr.co/edit/CCl2t6pwXO1zt042?preview)
- [Part 02. Loading assets](https://plnkr.co/edit/mdYPalEf7BrSgcTN?preview)
- [Part 03. World Building](https://plnkr.co/edit/0xy62Zn6xTaPjfKn?preview)
- [Part 04. The Platforms (explanation)](https://plnkr.co/edit/0pMUhCXw4kMdmMho?preview)
- [Part 05. Ready Player One](https://plnkr.co/edit/EqPp3bB3ObrHNB8x?preview)
- [Part 06. Body velocity](https://plnkr.co/edit/hQnbhTlqTEdYFgEL?preview)
- [Part 07. Controlling the player with the keyboard](https://plnkr.co/edit/LOG7BW3P5NgnV7TS?preview)
- [Part 08. Stardust](https://plnkr.co/edit/ubpn5G4CXZTcnPKX?preview)
- [Part 09. A score to settle](https://plnkr.co/edit/1nG161Y9ZFDPFpNe?preview)
- [Part 10. Bouncing Bombs](https://plnkr.co/edit/PT6viN6hJJ0FVW2X?preview)

![image](https://github.com/8Observer8/port-to-box2dwasm-of-making-your-first-game-rollup-phaser3-js/assets/3908473/8c1f42d8-387f-4767-b23b-03f5b028ea34)

Instructions for building and running the project in debug and release:

- Download and unzip this repository

- Open the command line terminal and go to the lesson folder

- Install the next packages globally with the command:

> npm i -g http-server rollup uglify-js

- Add the Rollup bin folder to the Path. Type this command to know where npm was installed `npm config get prefix`. This command will show you the npm location. You will find the "node_modules" folder there. Go to the "rollup/bin" folder and copy this path, for example for me: `C:\Users\8Observer8\AppData\Roaming\npm\node_modules\rollup\dist\bin`. Add this folder to the path variable.

- Run http-server in the project directory:

> http-server -c-1

Note. The `-c-1` key allows you to disable caching.

- Start development mode with the following command:

> npm run dev

Note. Rollup will automatically keep track of saving changes to files and build a new index.js file ready for debugging. You can debug your project step by step in the browser by setting breakpoints.

- Go to the browser and type the address: localhost:8080/index.html

- Create a compressed file ready for publishing. Stop development mode, for example, with this command Ctrl + C in CMD, if it was launched before and enter the command:

> npm run release

Note. After this command, Rollup will create a compressed index.js file. Compression is done using the uglify-js package.

If you want to thank me: https://8observer8.github.io/donate.html
