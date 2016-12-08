# 3D Redstone Simulator

A javascript performance experiment to simulate minecraft's redstone logic in a 3D environment.

[Click here to run the current version](https://cdn.rawgit.com/GuilhermeRossato/3D-Redstone-Simulator/master/index.html)

Note that during some periods (mid-development), the above link will not bring you to a working release, if you still want to run, I recommend downloading the last release and running yourself.

#Releases
 - v 0.1
![Preview v0.1](https://cdn.rawgit.com/GuilhermeRossato/3D-Redstone-Simulator/master/Images/Releases/v01.gif)
 - v 0.2
 -![Preview v0.2](https://cdn.rawgit.com/GuilhermeRossato/3D-Redstone-Simulator/master/Images/Releases/v02.png)

If you download a release and run index.html on your browser and see that a cross-origin conflict exists (all blocks or textures are black), then even though this application doesn't use any server-sided programming it might be necessary to run a server to run this application (such as Apache). It's not safe to allow a web applications to load your computer files, especially if it's run locally, that's why it's blocked on most browers. You could use chrome with disabled security check, but that tool is not safe for everyone, since it's aimed for developers, .

#Objectives and Priorities
1. Menu (done)
2. 3D Controls similar to minecraft (done)
3. Correct Block Drawing
4. Save/Load System
5. Redstone Simulation
6. Piston Simulation
7. Water and Lava Simulation

#Dependencies, Inspiration and Credits

1. [three.js](https://threejs.org/) - Javascript 3D Library - Used to represent the world
2. [Minecraft](https://minecraft.net/pt-br/) - by (Mojang)[https://mojang.com/]
3. Digital Circuit Logic, or [Boolean Algebra](https://en.wikipedia.org/wiki/Boolean_algebra)