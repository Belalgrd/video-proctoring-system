// frontend/src/utils/testScenarios.js
export const runTestScenarios = (onEvent) => {
  const scenarios = [
    { delay: 5000, event: { type: 'LOOKING_AWAY', message: 'User looking away' }},
    { delay: 10000, event: { type: 'NO_FACE', message: 'No face detected' }},
    { delay: 15000, event: { type: 'SUSPICIOUS_OBJECT', object: 'cell phone', message: 'Phone detected' }},
    { delay: 20000, event: { type: 'MULTIPLE_FACES', message: 'Multiple faces detected' }},
    { delay: 25000, event: { type: 'DROWSINESS', message: 'Possible drowsiness detected' }},
    { delay: 30000, event: { type: 'BACKGROUND_NOISE', message: 'Background voices detected' }}
  ];
  
  scenarios.forEach(scenario => {
    setTimeout(() => {
      onEvent([{ ...scenario.event, timestamp: Date.now() }]);
    }, scenario.delay);
  });
};