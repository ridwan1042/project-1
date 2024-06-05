const { Firestore } = require('@google-cloud/firestore');

const firestore = new Firestore();
const predictCollection = firestore.collection('predictions');

async function storeData(id, data) {
    return predictCollection.doc(id).set(data);
}

async function getData() {
    const snapshot = await predictCollection.get();
    return snapshot.docs.map(doc => doc.data());
}

module.exports = { storeData, getData };
