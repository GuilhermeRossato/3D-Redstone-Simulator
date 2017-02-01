# 3D Redstone Simulator

A javascript experiment to simulate minecraft's redstone logic in a 3D environment.

[Click here to run the current version](https://rawgit.com/GuilhermeRossato/3D-Redstone-Simulator/master/index.html)

Note that during development, the above link will not bring you to a working release, if you want you can download the most recent [release](https://github.com/GuilhermeRossato/3D-Redstone-Simulator/releases) and run it yourself, this experiment doesn't need building, it works out of the box.

#Releases
 - v 0.1 [Performance Viability Release]
![Preview v0.1](https://cdn.rawgit.com/GuilhermeRossato/3D-Redstone-Simulator/master/Images/Releases/v01_normal.gif)
 - v 0.2 [Primitive Block Distinction]
![Preview v0.2](https://cdn.rawgit.com/GuilhermeRossato/3D-Redstone-Simulator/master/Images/Releases/v02_normal.png)
 - v 0.3 [Collision Detection and Block Selection]
![Preview v0.3](https://github.com/GuilhermeRossato/3D-Redstone-Simulator/blob/master/Images/Releases/v03_normal.gif?raw=true)
 - v 0.4 [Inventory and Procedural Terrain Generation]
![Preview v0.4](https://github.com/GuilhermeRossato/3D-Redstone-Simulator/blob/master/Images/Releases/v04_normal.gif?raw=true)

If you download a release, (on windows) use the "Run" shortcut to the .bat to run chrome with web security disabled (not an easy thing to set up otherwise). That solves cross origin conflicts, all blocks textures wouldn't load otherwise. Use it at your own risk, the alternative is to set up a server to run this application (such as Apache). It's not safe to allow a local web application to load your computer files, that's why it's blocked on most browers.

#Objectives and Priorities
1. Menu (done)
2. 3D Controls similar to minecraft (done)
3. Correct Block Drawing (done)
4. Crosshair and Block Selection (done)
4. Procedural Terrain Generation (done / experimental / release v0.4 only)
4. Block placement (partially done)
5. Collision Detection (done)
6. Inventory and Hotbar system (partially done)
7. Selection tools (fill, copy, etc)
8. Save/Load System
9. Redstone Simulation
10. Piston Simulation
11. Water and Lava Simulation (low priority)

#Dependencies, Credits and Inspiration

1. [three.js](https://threejs.org/) - Javascript 3D Library - Used to represent the world
2. [Minecraft](https://minecraft.net/pt-br/) - by [Mojang](https://mojang.com/) - Inspiration
3. Digital Circuit Logic, or [Boolean Algebra](https://en.wikipedia.org/wiki/Boolean_algebra) - What is it useful for
