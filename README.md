# 3D Redstone Simulator

This project uses three.js (webgl) to simulate minecraft and its game mechanics directly in the browser.

[Click here to run the current version](https://grossato.com.br/static/3D-Redstone-Simulator/)

The movement, the controls, and the game textures match the original game: Use the left click to break blocks, right to place (and middle click to copy type). Use W A S D keys to move and Space/Shift to jump/crounch or move vertically.

Note that since this is under development the above link may not always bring you to a working release. If you want you can download the most recent [release](https://github.com/GuilhermeRossato/3D-Redstone-Simulator/releases) and run it yourself locally. This project doesn't need building and all dependeencies are already present so it should be as easy as `npm run start` on a freshly downloaded repository but the multiplayer functionality only works on the web.

# Releases
 - v 0.1 - Performance Viability Release

![Preview v0.1](https://grossato.com.br/static/3D-Redstone-Simulator/frontend/assets/images/releases/v01_normal.gif)

 - v 0.2 - Primitive Block Distinction

![Preview v0.2](https://grossato.com.br/static/3D-Redstone-Simulator/frontend/assets/images/releases/v02_normal.png)

 - v 0.3 - Collision Detection and Block Selection

![Preview v0.3](https://grossato.com.br/static/3D-Redstone-Simulator/frontend/assets/images/releases/v03_normal.gif)

 - v 0.4 - Inventory, Hotbar and Procedural Terrain Generation [Removed]

![Preview v0.4](https://grossato.com.br/static/3D-Redstone-Simulator/frontend/assets/images/releases/v04_normal.gif)

 - v 0.5 - ES6 Rewrite and Voxel AO Implementation

![Preview v0.5](https://grossato.com.br/static/3D-Redstone-Simulator/frontend/assets/images/releases/v05.gif)

 - v 0.6 - Block selection and block placement

![Preview v0.6](https://grossato.com.br/static/3D-Redstone-Simulator/frontend/assets/images/releases/v06.gif)

 - v 0.7 - Multiplayer and World persistance

![Preview v0.7](https://grossato.com.br/static/3D-Redstone-Simulator/frontend/assets/images/releases/v07.gif)

## Who is this for

This is an experiment to simulate the game in the browser and eventually to make developing redstone contraptions easier by allowing fast prototyping. It also serves as my project to experiment with project organization, design philosophy, test zone and whatever idea I came up with.

## How to run this repo locally

Download this repository and either run `npm run start` at the root of it or just run a static http server to serve files for `frontend` folder.

There are no dependencies, so you don't need to call `npm install`.

However, the backend is not included, so it will not work and your world and the changes you make in it will not be saved.

## Objectives, Priorities and Plan

1. Menu (done)
2. 3D Controls similar to minecraft (done)
3. Correct Block Rendering (done)
4. Crosshair and Block Selection (done)
5. Collision Detection (removed)
6. Procedural Terrain Generation (release v0.4 only)
7. **Major update** - rewrote everything with modern technology (done)
8. Inventory and Hotbar system (in progress)
9. Mobile and Gamepad compatibility (in progress)
10. Block placement (done)
11. Area select and selection tools
12. Multiplayer system (done)
13. Redstone Simulation
14. Piston Simulation
15. Water and Lava Simulation

## Easter eggs

You can relive the entire world block history (play it back) in some obscure undocumented way.

# Dependencies, Credits and Inspiration

1. [three.js](https://threejs.org/) - Javascript 3D Library - Used to render the world
2. [Minecraft](https://minecraft.net/pt-br/) - by [Mojang](https://mojang.com/) - Inspiration and original game
3. Digital Circuit Logic, or [Boolean Algebra](https://en.wikipedia.org/wiki/Boolean_algebra) - Definition of how complex redstone systems behave
