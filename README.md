# 3D Redstone Simulator

A javascript experiment to simulate minecraft's redstone logic in a similar 3D environment.

[Click here to run the current version](https://grossato.com.br/static/3D-Redstone-Simulator/)

Left click to break blocks, middle click to select block type, and right click to place blocks. WASD to move horizontally and Space/Shift to move vertically.

Note that during development, the above link will not always bring you to a working release, if you want you can download the most recent [release](https://github.com/GuilhermeRossato/3D-Redstone-Simulator/releases) and run it yourself. This project doesn't need building or installing dependencies, a simple static http server will do.

# Releases
 - v 0.1 - Performance Viability Release

![Preview v0.1](https://grossato.com.br/static/3D-Redstone-Simulator/frontend/assets/images/releases/v01_normal.gif)

 - v 0.2 - Primitive Block Distinction

![Preview v0.2](https://grossato.com.br/static/3D-Redstone-Simulator/frontend/assets/images/releases/v02_normal.png)

 - v 0.3 - Collision Detection and Block Selection

![Preview v0.3](https://grossato.com.br/static/3D-Redstone-Simulator/frontend/assets/images/releases/v03_normal.gif)

 - v 0.4 - Inventory, Hotbar and Procedural Terrain Generation

![Preview v0.4](https://grossato.com.br/static/3D-Redstone-Simulator/frontend/assets/images/releases/v04_normal.gif)

 - v 0.5 - ES6 Rewrite and Voxel AO Implementation

![Preview v0.5](https://grossato.com.br/static/3D-Redstone-Simulator/frontend/assets/images/releases/v05.gif)

 - v 0.6 - Block selection and block placement

![Preview v0.6](https://grossato.com.br/static/3D-Redstone-Simulator/frontend/assets/images/releases/v06.gif)

## Who is this for

This is an experiment to make developing redstone contraptions easier by allowing fast prototyping on the browser.

## How to run this repo locally

Download this repository and either run `npm run start` at the root of it or just run a static http server to serve files for `frontend` folder.

There are no dependencies, so you don't need to call `npm install`.

## Objectives, Priorities and Plan

1. Menu (done)
2. 3D Controls similar to minecraft (done)
3. Correct Block Drawing (done)
4. Crosshair and Block Selection (done)
5. Collision Detection (needs recreation)
6. Procedural Terrain Generation (release v0.4 only)
7. Inventory and Hotbar system (in progress)
8. **Major update** - rewrote everything with modern technology (done)
9. Mobile and Gamepad compatibility (in progress)
10. Block placement (done)
11. Area select and selection tools (copy/paste areas)
12. Save/Load System
13. Redstone Simulation
14. Piston Simulation
15. Water and Lava Simulation

# Dependencies, Credits and Inspiration

1. [three.js](https://threejs.org/) - Javascript 3D Library - Used to render the world
2. [Minecraft](https://minecraft.net/pt-br/) - by [Mojang](https://mojang.com/) - Inspiration and original game
3. Digital Circuit Logic, or [Boolean Algebra](https://en.wikipedia.org/wiki/Boolean_algebra) - Definition of how complex redstone systems behave
