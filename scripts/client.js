var simulator = (function(){
    "use strict";
    
    var scene=new THREE.Scene()
    var renderer = window.WebGLRenderingContext ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer()
    var light= new THREE.AmbientLight(0xffffff)            
    var camera, robot, robotArm, wireFrontLeft, wireFrontRight, wireBackLeft, wireBackRight, floor, backWall
    var boxes = []
    var lineMaterial;
    var storageGridLines = []
    var objectsToMove = []
    var boxes = []
    var boxPickupBox;
    const directionDown = new THREE.Vector3(0, -0.5, 0);
    const directionUp = new THREE.Vector3(0, 0.5, 0);

    const directionRight = new THREE.Vector3(0.5,0, 0);
    const directionLeft = new THREE.Vector3(-0.5,0, 0);
    
    var showStorageGrid=false;
    var socket = io();

    var externalSequence=0;


    $(function (){
        socket.on('moveRobot', function(position){
            position=convertPosition(position);
            log("Moving robot to: " + writePos(position))
            externalSequence++;
            moveRobot(position);
            
        })

        socket.on('placeBox', function(position){
            position=convertPosition(position);
            log("Place box: " + writePos(position))
            externalSequence++;
            moveRobot(position);
            externalSequence++;
            placeBox(position);
        });

        socket.on('pickupBox', function(position){
            position=convertPosition(position);
            log("Pickup box: " + writePos(position))
            externalSequence++;
            pickupBox(position);
        });

        socket.on('addBox', function(position){
            position=convertPosition(position);
            log("Add box: " + writePos(position))
            externalSequence++;
            addBox({x: position.x, y: position.y, z: position.z})
        });

    });

    function log(message)
    {
        console.log(message)
        socket.emit('eventMessage', message);
    }

    function moveRobot(position){
        ("MoveRobot ", position)
        if(position!= null)
        {
            externalSequence++;
            moveObject(robot, {x: position.x, y: robot.position.y, z: position.z},externalSequence)
            moveObject(robotArm, {x: position.x, y: robotArm.position.y, z: position.z},externalSequence)
            if(boxPickupBox != null)
            {
                moveObject(boxPickupBox, {x: position.x, y: boxPickupBox.position.y, z: position.z},externalSequence)
            }
        }
    }

    function initScene(){
        renderer.setSize( window.innerWidth, window.innerHeight);
        document.getElementById("webgl-container").appendChild(renderer.domElement);

        scene.add(light);
                          
        camera = new THREE.PerspectiveCamera(
        35,
        window.innerWidth / window.innerHeight,
        1,
        1000
        );
                            
        camera.position.z= 175;            
        scene.add( camera ); 


        var controls = new THREE.OrbitControls( camera, renderer.domElement );
        //controls.addEventListener( 'change', render ); // call this only in static scenes (i.e., if there is no animation loop)
        controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
        controls.dampingFactor = 0.25;
        controls.screenSpacePanning = false;
        controls.minDistance = 100;
        controls.maxDistance = 500
        controls.maxPolarAngle = Math.PI / 2;
        controls.enableKeys = false;

var textureLoader = new THREE.TextureLoader();

var texture0 = textureLoader.load( 'BLUETEXTURE.png' );
var texture1 = textureLoader.load( 'BLUETEXTURE.png' );
var texture2 = textureLoader.load( 'BLUETEXTURE.png' );
var texture3 = textureLoader.load( 'BLUETEXTURE.png' );
var texture4 = textureLoader.load( 'BLUEFACEFINAL.png' );
var texture5 = textureLoader.load( 'BLUETEXTURE.png' );

var materials = [
    new THREE.MeshBasicMaterial( { map: texture0 } ),
    new THREE.MeshBasicMaterial( { map: texture1 } ),
    new THREE.MeshBasicMaterial( { map: texture2 } ),
    new THREE.MeshBasicMaterial( { map: texture3 } ),
    new THREE.MeshBasicMaterial( { map: texture4 } ),
    new THREE.MeshBasicMaterial( { map: texture5 } )
];
var robotMaterial = new THREE.MeshFaceMaterial( materials );

     
        robot = new THREE.Mesh(
            new THREE.BoxGeometry(10,3,10),robotMaterial
            );
    
        robot.name="robot";   
        robot.position.y = 60;
        scene.add(robot);
    
        robotArm = new THREE.Mesh(
        new THREE.BoxGeometry(10,1,10),
        new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('BLUEDARK.png' ) })
        );
    
        robotArm.name="robotArm";   
        robotArm.position.y= robot.position.y- 5;

        scene.add(robotArm);

        backWall = new THREE.Mesh(
            new THREE.BoxGeometry(150,150,1),
            new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('BLUEWALLNEW.png' ) })
            );
        backWall.name="backWall";   
        backWall.position.z = -100;
        scene.add(backWall);
    
        floor = new THREE.Mesh(
                new THREE.BoxGeometry(150,1,150),
                new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load('glossyfloor.jpg' ) })
                );
        floor.name="floor";   
        floor.position.z = -50;
        floor.position.y = -50;
        scene.add(floor);
        SetupGrid();
        SetupWires();
        //BeginAnimation();
        render();
    }

    function BeginAnimation()
    {
        addBox({x: robotArm.position.x, y: floor.position.y+5, z: robotArm.position.z})
        pickupBox();
    }
    function ToggleStorageGrid()
    {
        showStorageGrid=!showStorageGrid;
        
        storageGridLines.forEach(line => {
            if(!showStorageGrid){
            scene.remove(line);
            }
            else{
                scene.add(line);
            }
        });
        
    }
    function SetupGrid()
    {
        for (var z=-10; z<0; z++)
        {
        
            for (var y=-5; y<5; y++)
            {
                for (var x=-5; x<5; x++)
                {
                    var geometryLine = new THREE.Geometry();
                    geometryLine.vertices.push(
                        new THREE.Vector3( x*10, y*10, z*10 ),
                        new THREE.Vector3( x*10, y*-10, z*10 )
                    );
                    var line = new THREE.Line( geometryLine, lineMaterial );
                    storageGridLines.push(line)

                    var geometryLine2 = new THREE.Geometry();
                    geometryLine2.vertices.push(
                        new THREE.Vector3( x*10, y*10, z*10 ),
                        new THREE.Vector3( x*-10, y*10, z*10 )
                    );
                    var line2 = new THREE.Line( geometryLine2, lineMaterial );
                    storageGridLines.push(line2)

                    var geometryLine3 = new THREE.Geometry();
                    geometryLine3.vertices.push(
                        new THREE.Vector3( x*10, y*10, z*1 ),
                        new THREE.Vector3( x*10, y*10, z*10 )
                    );
                    var line3 = new THREE.Line( geometryLine3, lineMaterial );
                    storageGridLines.push(line3)


                }
            }
        }
    }

    function SetupWires(){
       scene.remove(wireFrontLeft) 
       scene.remove(wireFrontRight) 
       scene.remove(wireBackRight) 
       scene.remove(wireBackLeft) 
        lineMaterial = new THREE.LineBasicMaterial({
            color: 0x6699FF, linewidth: 502  
            
        });
        
        var geometryWirteFrontLeft = new THREE.Geometry();
        geometryWirteFrontLeft.vertices.push(
            new THREE.Vector3(  robot.position.x-5, robot.position.y+1.5, robot.position.z-5 ),
            new THREE.Vector3( -50,robot.position.y, -100 ),
        );
        
         wireFrontLeft = new THREE.Line( geometryWirteFrontLeft, lineMaterial );
        scene.add( wireFrontLeft );


        var geometryWirteFrontRight = new THREE.Geometry();
        geometryWirteFrontRight.vertices.push(
            new THREE.Vector3(  robot.position.x+5, robot.position.y+1.5, robot.position.z-5 ),
            new THREE.Vector3( 50, robot.position.y, -100 ),
        );
        
        wireFrontRight = new THREE.Line( geometryWirteFrontRight, lineMaterial );
        scene.add( wireFrontRight );


        var geometryWirteBackLeft = new THREE.Geometry();
        geometryWirteBackLeft.vertices.push(
            new THREE.Vector3(  robot.position.x-5, robot.position.y+1.5, robot.position.z+5 ),
            new THREE.Vector3( -50, robot.position.y, 0 ),
        );
        
        wireBackLeft = new THREE.Line( geometryWirteBackLeft, lineMaterial );
        scene.add( wireBackLeft );


        var geometryWirteBackRight = new THREE.Geometry();
        geometryWirteBackRight.vertices.push(
            new THREE.Vector3(  robot.position.x+5, robot.position.y+1.5, robot.position.z+5 ),
            new THREE.Vector3( 50, robot.position.y, 0 ),
        );
        
        wireBackRight = new THREE.Line( geometryWirteBackRight, lineMaterial );
        scene.add( wireBackRight );
    }

    function findHigestBox()
    {
        var foundBox
        boxes.forEach(box => {
            if(box.position.x == robotArm.position.x && box.position.z == robotArm.position.z)
            {
                if(foundBox != null)
                {
                   if(box.position.y > foundBox.y){
                    foundBox = box;
                   }
                }
                else{
                    foundBox=box;
                }
            }
        });
        
        if(foundBox != boxPickupBox){
        return foundBox;
        }
        else{
            return null;
        }
    }

    function findBox(searchPosition)
    {
        var foundBox
        boxes.forEach(box => {
            if(box.position.x == searchPosition.x && searchPosition.z == searchPosition.z && searchPosition.y == searchPosition.y)
            {
                    foundBox=box;
            }
        });
        return foundBox;
    }

    function writePos(position)
    {
        return "X:" + position.x + " Y:" + position.y + " Z:" + position.z;
    }

    function convertPosition(position)
    {
        return {x:position.x, z: position.y, y: position.z}
    }

    function pickupBox(boxPosition)
    {
        boxPickupBox = findBox(boxPosition);

        if(boxPickupBox != null)
        {
            log("Found box at" + writePos(boxPosition))
        }
        else{
            log("Didn't find box at" + writePos(boxPosition))
        }

        if(boxPickupBox == null)
        {
            log("Adding box at" + writePos(boxPosition))
            boxPickupBox= addBox(boxPosition)   
        }

        if(boxPickupBox != null)
        {
            
           moveRobot(boxPosition);

           moveObject(robotArm, {x: boxPosition.x, y:  boxPosition.y+6, z: boxPosition.z},externalSequence+2)
           moveObject(robotArm, {x: boxPosition.x, y:  robot.position.y-6, z: boxPosition.z},externalSequence+3)
           moveObject(boxPickupBox, {x: boxPosition.x, y:   robot.position.y-12, z: boxPosition.z},externalSequence+3)
        }
        
    }

    function placeBox(boxPosition)
    {
        moveRobot(boxPosition);

        moveObject(robotArm, {x: boxPosition.x, y: boxPosition.y +4, z: boxPosition.z},externalSequence)
        moveObject(boxPickupBox, {x: boxPosition.x, y:  boxPosition.y, z: boxPosition.z},externalSequence)
        moveObject(robotArm, {x: boxPosition.x, y: robot.position.y-6, z:boxPosition.z},externalSequence+1, function(){boxPickupBox=null; socket.emit('boxPlaced', {x:boxPosition.x,y:boxPosition.y,z:boxPosition.z}); })
    
    }

    function addBox(position){

        var textureLoader = new THREE.TextureLoader();

        var texture0 = textureLoader.load( 'EUROBOXSIDE.png' );
        var texture1 = textureLoader.load( 'EUROBOXSIDE.png' );
        var texture2 = textureLoader.load( 'EUROBOXLID.png' );
        var texture3 = textureLoader.load( 'EUROBOXSIDE.png' );
        var texture4 = textureLoader.load( 'EUROBOXSIDE.png' );
        var texture5 = textureLoader.load( 'EUROBOXSIDE.png' );
        
        var materials = [
            new THREE.MeshBasicMaterial( { map: texture0 } ),
            new THREE.MeshBasicMaterial( { map: texture1 } ),
            new THREE.MeshBasicMaterial( { map: texture2 } ),
            new THREE.MeshBasicMaterial( { map: texture3 } ),
            new THREE.MeshBasicMaterial( { map: texture4 } ),
            new THREE.MeshBasicMaterial( { map: texture5 } )
        ];
        var boxMaterial = new THREE.MeshFaceMaterial( materials );
        

        var box = new THREE.Mesh(
            new THREE.BoxGeometry(10,10,10),
            boxMaterial
            );
        box.name="box" + boxes.length;   
        box.position.y = position.y;
        box.position.x = position.x;
        box.position.z = position.z;
        boxes.push(box);
        scene.add(box);
        return box;
    }

    var currentlyPressedKeys = {};

    function handleKeyDown(event) {
      currentlyPressedKeys[event.keyCode] = true;
        log("Key pressed:"+ event.keyCode);
      if (String.fromCharCode(event.keyCode) == "F") {
        filter += 1;
        if (filter == 3) {
          filter = 0;
        }
      }
    }
  
    function handleKeyUp(event) {
      currentlyPressedKeys[event.keyCode] = false;
    }


    function handleKeys() {

        if (currentlyPressedKeys[80]) { //P
            pickupBox();
        }

        if (currentlyPressedKeys[68]) { //D
            placeBox();
        }


        if (currentlyPressedKeys[88]) { //X
            ToggleStorageGrid();
        }

        if (currentlyPressedKeys[65]) { //A
            addBox({x: robotArm.position.x, y: floor.position.y+5, z: robotArm.position.z})
          }
  

        if (currentlyPressedKeys[33]) {
          // Page Up

          if(robotArm.position.y <  robot.position.y - 5  )
          {
            moveObject(robotArm, {x: robotArm.position.x, y: robotArm.position.y+1, z: robotArm.position.z})
            if(boxPickupBox != null)
            {
                moveObject(boxPickupBox, {x: boxPickupBox.position.x, y: boxPickupBox.position.y+1, z: boxPickupBox.position.z})
            }
          }
        }

        if (currentlyPressedKeys[34]) {
          // Page Down
          if(robotArm.position.y > floor.position.y+2)
          {
            moveObject(robotArm, {x: robotArm.position.x, y: robotArm.position.y-1, z: robotArm.position.z})
            if(boxPickupBox != null)
            {
                moveObject(boxPickupBox, {x: boxPickupBox.position.x, y: boxPickupBox.position.y-1, z: boxPickupBox.position.z})
            }

          }
        }
        if (currentlyPressedKeys[37]) {
          // Left cursor key
          if(robot.position.x > -45){
            moveObject(robotArm, {x: robotArm.position.x-1, y: robotArm.position.y, z: robotArm.position.z})
            moveObject(robot, {x: robot.position.x-1, y: robot.position.y, z: robot.position.z})
            if(boxPickupBox != null)
            {
                moveObject(boxPickupBox, {x: boxPickupBox.position.x-1, y: boxPickupBox.position.y, z: boxPickupBox.position.z})
            }
            
          }
        }
        if (currentlyPressedKeys[39]) {
          // Right cursor key
          if(robot.position.x < 45){
            moveObject(robotArm, {x: robotArm.position.x+1, y: robotArm.position.y, z: robotArm.position.z})
            moveObject(robot, {x: robot.position.x+1, y: robot.position.y, z: robot.position.z})
            if(boxPickupBox != null)
            {
                moveObject(boxPickupBox, {x: boxPickupBox.position.x+1, y: boxPickupBox.position.y, z: boxPickupBox.position.z})
            }

          }
        }
        if (currentlyPressedKeys[38]) {
          // Up cursor key
          if(robot.position.z > -95){
            moveObject(robotArm, {x: robotArm.position.x, y: robotArm.position.y, z: robotArm.position.z-1})
            moveObject(robot, {x: robot.position.x, y: robot.position.y, z: robot.position.z-1})
            if(boxPickupBox != null)
            {
                moveObject(boxPickupBox, {x: boxPickupBox.position.x, y: boxPickupBox.position.y, z: boxPickupBox.position.z-1})
            }


          }
        }
        if (currentlyPressedKeys[40]) {
          // Down cursor key
          if(robot.position.z < 0){
            moveObject(robotArm, {x: robotArm.position.x, y: robotArm.position.y, z: robotArm.position.z+1})
            moveObject(robot, {x: robot.position.x, y: robot.position.y, z: robot.position.z+1})

            if(boxPickupBox != null)
            {
                moveObject(boxPickupBox, {x: boxPickupBox.position.x, y: boxPickupBox.position.y, z: boxPickupBox.position.z+1})
            }

          }
        }
      }

      function moveObjects()
      {
          var objectsReachedDestination = []
          var sequenceToHandle = -1;
          
          objectsToMove.forEach(objectToMove => {
              if(objectToMove.sequence < sequenceToHandle || sequenceToHandle==-1)
              {
                  sequenceToHandle= objectToMove.sequence
              }
          });

          if(sequenceToHandle>0)
          {
              ("Sequence to handle :" + sequenceToHandle)
          }

          objectsToMove.forEach(destinationObject => {
              if(destinationObject.sequence==sequenceToHandle)
              {
                    destinationObject.objectToMove.position.x = moveTowardsValue(destinationObject.objectToMove.position.x, destinationObject.destinationPosition.x)  
                    destinationObject.objectToMove.position.y = moveTowardsValue(destinationObject.objectToMove.position.y, destinationObject.destinationPosition.y)  
                    destinationObject.objectToMove.position.z = moveTowardsValue(destinationObject.objectToMove.position.z, destinationObject.destinationPosition.z)  

                    if(
                        destinationObject.objectToMove.position.x == destinationObject.destinationPosition.x &&
                        destinationObject.objectToMove.position.y == destinationObject.destinationPosition.y &&
                        destinationObject.objectToMove.position.z == destinationObject.destinationPosition.z 
                    )
                    {
                        objectsReachedDestination.push(destinationObject);
                    }
            }}
        );

          objectsReachedDestination.forEach(objectWithReachedDestination => {
                var index = objectsToMove.indexOf(objectWithReachedDestination);
                if (index > -1) {
                    objectsToMove.splice(index, 1);
                }
                if(objectWithReachedDestination.executeAfterDestinationReached != null)
                {
                    objectWithReachedDestination.executeAfterDestinationReached();
                }
          }
        );
      }


      function moveObject(object, position, sequence, executeAfterDestinationReached)
      {
          if(sequence==null)
          {
              sequence =0;
          }

           socket.emit('objectMove', {name:object.name, x:position.x,y:position.y,z:position.z}); 

          if(executeAfterDestinationReached == null)
          {
              executeAfterDestinationReached = function() {  socket.emit('objectMoved', {name:object.name, x:position.x,y:position.y,z:position.z}); };
          }
        objectsToMove.push({objectToMove:object, destinationPosition:position, sequence:sequence, executeAfterDestinationReached:executeAfterDestinationReached})
        log("Moving obj from:" + object.name + writePos(object.position));
        log("Moving obj to:" + object.name + writePos(position) + " seq:" + sequence + " executeAfterDestinationReached:"+ executeAfterDestinationReached);
      }

      function  moveTowardsValue(currentValue, destinationValue)
      {
        if(currentValue < destinationValue)
        {
            return currentValue += 1;
        }

        if(currentValue > destinationValue)
        {
            return currentValue -= 1;
        }
        return currentValue;
      }



    function render(){
        handleKeys();
        SetupWires();
        if(objectsToMove.length>0){
        moveObjects();
        }
        renderer.render(scene, camera); 
        requestAnimationFrame(render);        
    }

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
    window.onload = initScene;
    
    return {
        scene: scene
    }

})();
