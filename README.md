# 3D Redstone Simulator

A javascript experiment to simulate minecraft's redstone logic in a similar 3D environment.

[Click here to run the current version](https://guilherme-rossato.com/3D-Redstone-Simulator/)

Note that during development, the above link will not always bring you to a working release, if you want you can download the most recent [release](https://github.com/GuilhermeRossato/3D-Redstone-Simulator/releases) and run it yourself, this experiment doesn't need building, it works out of the box.

# Releases
 - v 0.1 - Performance Viability Release
![Preview v0.1](https://github.com/GuilhermeRossato/3D-Redstone-Simulator/blob/master/assets/images/releases/v01_normal.gif?raw=true)
 - v 0.2 - Primitive Block Distinction
![Preview v0.2](https://cdn.rawgit.com/GuilhermeRossato/3D-Redstone-Simulator/master/assets/images/releases/v02_normal.png)
 - v 0.3 - Collision Detection and Block Selection
![Preview v0.3](https://github.com/GuilhermeRossato/3D-Redstone-Simulator/blob/master/assets/images/releases/v03_normal.gif?raw=true)
 - v 0.4 - Inventory, Hotbar and Procedural Terrain Generation
![Preview v0.4](https://github.com/GuilhermeRossato/3D-Redstone-Simulator/blob/master/assets/images/releases/v04_normal.gif?raw=true)
 - v 0.5 - ES6 Rewrite and Voxel AO Implementation
![Preview v0.5](https://github.com/GuilhermeRossato/3D-Redstone-Simulator/blob/master/assets/images/releases/v05.gif?raw=true)

## Who is this for

This is an experiment to make developing redstone contraptions easier.

## How to run this repo locally

If you have PHP or Python installed, you can just use one of the `/tools/run-*.bat` files to open the web browser and host the application locally.

If you want to use Node, which I recommend, you can install dependencies running the following command at the repository root:

```
npm install
```

Then, whenever you want to start the aplication:

```
npm run start
```

And if you want to build the application and pack it, run the following command:

```
npm run build
```

And alter `index.html` to load the bundle script at `/build/script.js`

## Objectives, Priorities and Plan

1. Menu (done)
2. 3D Controls similar to minecraft (done)
3. Correct Block Drawing (done)
4. Crosshair and Block Selection (done)
5. Collision Detection (needs recreation)
6. Procedural Terrain Generation (release v0.4 only)
7. Inventory and Hotbar system (done)
8. **Major update** - rewrote everything with modern technology (done)
9. Mobile and Gamepad compatibility (in progress)
10. Block placement
11. Selection tools
12. Save/Load System (partially done)
13. Redstone Simulation
14. Piston Simulation
15. Water and Lava Simulation

# Dependencies, Credits and Inspiration

1. [three.js](https://threejs.org/) - Javascript 3D Library - Used to render the world
2. [Minecraft](https://minecraft.net/pt-br/) - by [Mojang](https://mojang.com/) - Inspiration
3. Digital Circuit Logic, or [Boolean Algebra](https://en.wikipedia.org/wiki/Boolean_algebra) - What it is useful for
