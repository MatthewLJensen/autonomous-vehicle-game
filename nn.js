// Credit to TheCodingTrain for the original code
// https://www.youtube.com/watch?v=cdUNkwXx-I4

// https://github.com/processing/p5.js/issues/102
function randomGaussian() {
    do {
        var x1 = (Math.random() * 2) - 1;
        var x2 = (Math.random() * 2) - 1;
        var w = x1 * x1 + x2 * x2;
    } while (w >= 1);
    w = Math.sqrt((-2 * Math.log(w)) / w);
    //console.log(x1 * w);
    return x1 * w;
}

class NeuralNetwork {
    constructor(a, b, c, d) {
        if (a instanceof tf.Sequential) {
            this.model = a
            this.input_nodes = b
            this.hidden_nodes = c
            this.output_nodes = d
        } else {
            this.input_nodes = a
            this.hidden_nodes = b
            this.output_nodes = c
            this.model = this.createModel()
        }
    }

    copy() {
        return tf.tidy(() => {
            const modelCopy = this.createModel()
            const weights = this.model.getWeights()
            const weightCopies = []

            for (let i = 0; i < weights.length; i++) {
                weightCopies[i] = weights[i].clone()
            }

            modelCopy.setWeights(weightCopies)

            return new NeuralNetwork(modelCopy, this.input_nodes, this.hidden_nodes, this.output_nodes)
        })
    }

    mutate(rate) {
        tf.tidy(() => {
            const weights = this.model.getWeights()
            const mutatedWeights = []
            for (let i = 0; i < weights.length; i++) {
                let tensor = weights[i]
                let shape = weights[i].shape
                let values = tensor.dataSync().slice()
                for (let j = 0; j < values.length; j++) {
                    if (Math.random(1) < rate) {
                        let w = values[j]
                        values[j] = w + randomGaussian() //currently relies on p5js. https://p5js.org/reference/#/p5/randomGaussian
                    }
                }
                let newTensor = tf.tensor(values, shape)
                mutatedWeights[i] = newTensor
            }
            this.model.setWeights(mutatedWeights)
        })
    }

    dispose() {
        this.model.dispose()
    }

    predict(inputs) {
        return tf.tidy(() => {
            const xs = tf.tensor2d([inputs])
            const ys = this.model.predict(xs)
            const outputs = ys.dataSync()
            //console.log(outputs)
            return outputs
        })
    }

    createModel() {
        const model = tf.sequential()
        const hidden1 = tf.layers.dense({
            units: this.hidden_nodes,
            //inputDim: this.input_nodes,
            inputShape: [this.input_nodes],
            activation: 'sigmoid'
        })
        const hidden2 = tf.layers.dense({
            units: this.hidden_nodes,
            //inputDim: this.input_nodes,
            inputShape: [this.hidden_nodes],
            activation: 'sigmoid'
        })

        model.add(hidden1)
        //model.add(hidden2)
        const output = tf.layers.dense({
            units: this.output_nodes,
            activation: 'sigmoid' // sigmoid vs softmax?
        })
        model.add(output)
        return model
    }
}