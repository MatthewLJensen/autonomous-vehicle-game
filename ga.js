// Credit to Daniel Shiffman - Neuro-Evolution Flappy Bird
// Adapted to control an autonomous agent

function nextGeneration() {
    console.log('next generation');
    calculateFitness();
    //console.log(agents)
    for (let i = 0; i < TOTAL; i++) {
      agents[i] = pickOne();
    }
    for (let i = 0; i < TOTAL; i++) {
      savedAgents[i].dispose();
    }
    savedAgents = [];
  }
  
  function pickOne() {
    let index = 0;
    let r = Math.random();
    
    while (r > 0) {
      r = r - savedAgents[index].fitness;
      index++;
    }
    index--;

    console.log(savedAgents[index].score);
    let agent = savedAgents[index];
    let child = new Agent(agent.brain);
    child.mutate();
    return child;
  }
  
  function calculateFitness() {
    let sum = 0;
    for (let agent of savedAgents) {
      sum += agent.score;
    }
    for (let agent of savedAgents) {
      agent.fitness = agent.score / sum;
    }
  }