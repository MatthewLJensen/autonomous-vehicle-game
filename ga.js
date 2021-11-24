// Credit to Daniel Shiffman - Neuro-Evolution Flappy Bird
// Adapted to control an autonomous agent

function nextGeneration() {
    console.log('next generation');
    calculateFitness();
    //console.log(agents)

    // find agent with highest fitness
    let maxFitness = savedAgents[0]
    for (let agent of savedAgents) {
        if (agent.fitness > maxFitness.fitness) {
            maxFitness = agent;
        }
    }
    agents[TOTAL - 1] = new Agent(maxFitness.brain);
    agents[TOTAL - 1].winner = true


    for (let i = 0; i < TOTAL - 1; i++) {
        agents[i] = pickOne();
    }
    for (let i = 0; i < TOTAL; i++) {
        savedAgents[i].dispose();
    }
    savedAgents = [];
}


// function pickOne(mutate = true) {
//     savedAgents.sort((a, b) => (a.fitness > b.fitness) ? 1 : -1)
//     //console.log(savedAgents)
//     let agent = savedAgents[savedAgents.length - 1]
//     //console.log(agent)
//     let child = new Agent(agent.brain);
//     if (mutate) {
//         child.mutate();
//     }
//     return child;

// }

  function pickOne(mutate = true) {
    let index = 0;
    let r = Math.random();
    while (r > 0) {
      r = r - savedAgents[index].fitness;
      index++;
    }
    index--;

    let agent = savedAgents[index];
    let child = new Agent(agent.brain);
    if (mutate) {
        child.mutate();
    }
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