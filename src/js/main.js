import { Lift } from "./lift.js";

// take input for number of lifts and floors
const startButton = document.getElementById("start");

let numberOfLifts = 0;
let numberOfFloors = 0;

let liftsAtFloor = new Map();

const upButtonChevronSrc = "assets/chevron-up.svg";
const downButtonChevronSrc = "assets/chevron-down.svg";

const pendingRequests = [];

startButton.addEventListener("click", () => {
  numberOfLifts = parseInt(document.getElementById("lifts").value);
  numberOfFloors = parseInt(document.getElementById("floors").value);
  if (numberOfFloors < 2) {
    alert("Please enter a valid number of floors");
    return;
  }
  if (numberOfLifts < 1) {
    alert("Please enter a valid number of lifts");
    return;
  }
  if (numberOfLifts > 10) {
    alert("Only 10 lifts are supported");
    return;
  }
  if (numberOfFloors > 50) {
    alert("Only 50 floors are supported");
    return;
  }
  document.getElementById("config").classList.add("hidden");
  document.getElementById("building").classList.remove("hidden");

  initialzeFloors(numberOfFloors);
  initializeLifts(numberOfLifts);
});

const initialzeFloors = (totalFloors) => {
  const building = document.getElementById("building");
  for (let i = totalFloors; i > 0; i--) {
    const floor = createFloor(i, totalFloors);
    building.appendChild(floor);
    liftsAtFloor.set(i, []);
  }
};

const createFloor = (floorNumber, totalFloors) => {
  const floor = document.createElement("div");
  floor.id = `floor-${floorNumber}`;
  floor.classList.add("floor", "flex", "border-2", "border-slate-100", "h-[100px]", "w-[80%]");
  const leftContainer = document.createElement("div");
  const floorNumberText = document.createElement("p");
  floorNumberText.innerText = `Floor ${floorNumber}`;
  const { upButton, downButton } = getLiftButtons();
  if (floorNumber === 1) {
    leftContainer.appendChild(upButton);
    leftContainer.appendChild(floorNumberText);
  } else if (floorNumber === totalFloors) {
    leftContainer.appendChild(floorNumberText);
    leftContainer.appendChild(downButton);
  } else {
    leftContainer.appendChild(upButton);
    leftContainer.appendChild(floorNumberText);
    leftContainer.appendChild(downButton);
  }
  floor.appendChild(leftContainer);
  const liftsContainer = document.createElement("div");
  liftsContainer.classList.add("lifts", "flex", "justify-around", "grow");
  floor.appendChild(liftsContainer);

  return floor;
};

const getLiftButtons = () => {
  const upButton = document.createElement("button");
  upButton.classList.add("up", "text-blue-500", "hover:text-blue-600");
  upButton.innerHTML = `<img src="${upButtonChevronSrc}" />`;
  const downButton = document.createElement("button");
  downButton.classList.add("down", "text-blue-500", "hover:text-blue-600");
  downButton.innerHTML = `<img src="${downButtonChevronSrc}" />`;
  upButton.addEventListener("click", handleButtonPress);
  downButton.addEventListener("click", handleButtonPress);

  return { upButton, downButton };
};

const initializeLifts = (totalLifts) => {
  const groundFloor = document.getElementById("floor-1").querySelector(".lifts");
  for (let i = 1; i <= totalLifts; i++) {
    const lift = createLift(i);
    groundFloor.appendChild(lift);
  }
};

const createLift = (liftNumber) => {
  const lift = document.createElement("section");
  lift.id = `lift-${liftNumber}`;
  lift.classList.add(
    "lift",
    "border-2",
    "border-slate-300",
    "h-[100px]",
    "w-[60px]",
    "bg-slate-100",
    "ml-4",
    "flex",
    "justify-between"
  );
  lift.innerHTML = `
    <div class="left-door w-[30px] bg-slate-300"></div>
    <div class="right-door w-[30px] bg-slate-300"></div>
  `;
  const newLift = new Lift(liftNumber, 1, "idle");
  liftsAtFloor.get(1).push(newLift);
  return lift;
};

const handleButtonPress = (event) => {
  const calledFloorId = parseInt(event.target.parentElement.parentElement.parentElement.id.split("-")[1]);

  if (!calledFloorId) return;
  handleLiftCall(calledFloorId);
};

const handleLiftCall = (calledFloorId) => {
  if (liftsAtFloor.get(calledFloorId) && liftsAtFloor.get(calledFloorId).length > 0) {
    return;
  }
  const availableLift = getAvailableLift(calledFloorId);
  if (!availableLift) {
    pendingRequests.push(calledFloorId);
    return;
  }
  liftsAtFloor.get(availableLift.floor).splice(liftsAtFloor.get(availableLift.floor).indexOf(availableLift), 1);
  liftsAtFloor.get(calledFloorId).push(availableLift);
  const liftElement = document.getElementById(`lift-${availableLift.id}`);
  const diff = Math.abs(calledFloorId - availableLift.floor);
  liftElement.style.transition = `transform ${diff * 200}ms ease-in-out`;
  availableLift.status = "moving";
  liftElement.style.transform = `translateY(-${(calledFloorId - 1) * 100}px)`;
  setTimeout(() => {
    openAndCloseDoors(availableLift).then(() => {
      setTimeout(() => {
        availableLift.floor = calledFloorId;
        availableLift.status = "idle";
        handlePendingRequests();
      }, 2000);
    });
  }, diff * 200);
};

const openAndCloseDoors = (lift) => {
  const liftElement = document.getElementById(`lift-${lift.id}`);
  const leftDoor = liftElement.querySelector(".left-door");
  const rightDoor = liftElement.querySelector(".right-door");
  leftDoor.classList.add("open");
  rightDoor.classList.add("open");
  return new Promise((resolve) => {
    setTimeout(() => {
      leftDoor.classList.remove("open");
      rightDoor.classList.remove("open");
      resolve();
    }, 3000);
  });
};

const getAvailableLift = (calledFloorId) => {
  let up = calledFloorId + 1;
  let down = calledFloorId - 1;
  while (up <= numberOfFloors || down >= 1) {
    if (up <= numberOfFloors && liftsAtFloor.get(up).length > 0) {
      for (const lift of liftsAtFloor.get(up)) {
        if (lift.status === "idle") {
          return lift;
        }
      }
    }
    if (down >= 1 && liftsAtFloor.get(down).length > 0) {
      for (const lift of liftsAtFloor.get(down)) {
        if (lift.status === "idle") {
          return lift;
        }
      }
    }
    up++;
    down--;
  }
};

const handlePendingRequests = () => {
  if (pendingRequests.length === 0) return;
  const calledFloorId = pendingRequests.shift();
  handleLiftCall(calledFloorId);
};
