/* *
 * This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
 * Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
 * session persistence, api calls, and more.
 * */
const Alexa = require('ask-sdk-core');

var persistenceAdapter = getPersistenceAdapter();
var estadoPartida = 0;
var opcion = 0;
var inventario = [];

function getPersistenceAdapter() {
    // This function is an indirect way to detect if this is part of an Alexa-Hosted skill
    function isAlexaHosted() {
        return process.env.S3_PERSISTENCE_BUCKET ? true : false;
    }
    const tableName = 'can_clues_table';
    if(isAlexaHosted()) {
        const {S3PersistenceAdapter} = require('ask-sdk-s3-persistence-adapter');
        return new S3PersistenceAdapter({ 
            bucketName: process.env.S3_PERSISTENCE_BUCKET
        });
    } else {
        // IMPORTANT: don't forget to give DynamoDB access to the role you're to run this lambda (IAM)
        const {DynamoDbPersistenceAdapter} = require('ask-sdk-dynamodb-persistence-adapter');
        return new DynamoDbPersistenceAdapter({ 
            tableName: tableName,
            createTable: true
        });
    }
}




const LoadAttributesRequestInterceptor = {
    async process(handlerInput) {
        if(handlerInput.requestEnvelope.session['new']){ //is this a new session?
            const {attributesManager} = handlerInput;
            const persistentAttributes = await attributesManager.getPersistentAttributes() || {};
            //copy persistent attribute to session attributes
            handlerInput.attributesManager.setSessionAttributes(persistentAttributes);
        }
    }
};

const SaveAttributesResponseInterceptor = {
    async process(handlerInput, response) {
        const {attributesManager} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        const shouldEndSession = (typeof response.shouldEndSession === "undefined" ? true : response.shouldEndSession);//is this a session end?
        if(shouldEndSession || handlerInput.requestEnvelope.request.type === 'SessionEndedRequest') { // skill was stopped or timed out            
            attributesManager.setPersistentAttributes(sessionAttributes);
            await attributesManager.savePersistentAttributes();
        }
    }
};

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        let speakOutput = '';
        
        const {attributesManager} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        
        /*if(handlerInput.requestEnvelope.session['new']){
            estadoPartida = 0;
        }*/
        
        //const ultimoEstado = sessionAttributes['ultimoEstado'];
        
        if(estadoPartida === 0){
        speakOutput = 'Bienvenido a Can Clues, ¿quieres iniciar una partida?'
        }else{
            speakOutput = 'Bienvenido a Can Clues. Hay una partida guardada, ¿quieres continuar?'
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const YesIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent';
    },
    handle(handlerInput) {
        let speakOutput = '';
        
        if(estadoPartida === 0){
            speakOutput = `Durante este juego tendrás que usar algunos objetos y tomar decisiones que afectarán el rumbo de la historia... Comienza el juego 
            <voice name="Lupe"> <amazon:domain name="news"> <audio src="soundbank://soundlibrary/radios_static/radios_static_06"/> La hija de Isao Okada, el dueño de la fábrica más grande de nuestra ciudad, ha desaparecido este 9 de abril. Su nombre es Hana Okada, lo último que se sabe de ella es que iba en camino a su casa después de la escuela, pero nunca llegó. Se rastreó su celular y su más reciente localización indica que estaba en el bosque Kokura... </amazon:domain> </voice> <audio src="soundbank://soundlibrary/radios_static/radios_static_06"/>
            Silencias el radio, eres el detective asignado al caso y ya sabes toda esa información, ahora mismo te diriges en un auto a aquel bosque. 
            Vas junto a tu fiel compañero canino, Scraps. 
            Eres una persona cuyo único interés es tu trabajo a excepción de tu canino Scraps, el cual desde que lo obtuviste has dedicado mucho tiempo a entrenar para seguir tus comandos y ayudar en tu trabajo. 
            Al llegar bajas de tu auto junto a Scraps e inspeccionas tu cajuela; tienes una mochila pero ésta sólo tiene espacio para 3 objetos. Los objetos son: linterna, batería portatil, botiquín, cinta métrica, grabadora y rompe candados.
            ¿Qué te gustaría llevar? Sólo di el nombre de los objetos, por ejemplo, linterna, grabadora, cuerda`
        }else{
            speakOutput = 'Continuarás donde te quedaste'
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(`Tienes una mochila pero ésta sólo tiene espacio para 3 objetos. Los objetos son: linterna, batería portatil, botiquín, cinta métrica, grabadora y rompe candados.
            ¿Qué te gustaría llevar? Sólo di el nombre de los objetos, por ejemplo, linterna, grabadora, cuerda`)
            .getResponse();
    }
}

const ObjetoIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ObjetoIntent';
    },
    handle(handlerInput) {
        
        const {attributesManager} = handlerInput;
        const sessionAttributes = attributesManager.getSessionAttributes();
        
        console.log(`Llego aqui`)
        const objetoUno = handlerInput.requestEnvelope.request.intent.slots.objetoUno.value
        const objetoDos = handlerInput.requestEnvelope.request.intent.slots.objetoDos.value
        const objetoTres = handlerInput.requestEnvelope.request.intent.slots.objetoTres.value
        
        inventario[0] = objetoUno
        inventario[1] = objetoDos
        inventario[2] = objetoTres
        
        const speakOutput = `Has seleccionado ${objetoUno}, ${objetoDos} y ${objetoTres}... Con todo listo te decides a entrar al bosque, caminas sin rumbo por un rato sin encontrar nada, de repente Scraps insiste en ir a una dirección en particular.
        ¿Qué quieres hacer?`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
}

const UnoDosIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'UnoDosIntent';
    },
    handle(handlerInput) {
        
        const numero = handlerInput.requestEnvelope.request.intent.slots.numero.value
        
        let speakOutput = '';
        
        switch(opcion){
            case 0:
                if(numero === 1){
                    speakOutput = `Sigues mirando alrededor y encuentras una huella fresca frente a ti que obviamente no es tuya, necesitas medirla para saber si es de un hombre o una mujer.`
                    opcion = 1
                } else {
                    speakOutput = `Scraps te guía hacia algo que está colgando de una rama, te acercas y observas que es un pedazo de tela, al parecer es de una blusa de mujer. Se escucha que algo se está moviendo entre la hierba y Scraps le empieza a ladrar ferozmente.`
                    opcion = 2
                }
            break;
            case 2:
                if(numero === 1){
                    speakOutput = `Sigues mirando alrededor y encuentras una huella fresca frente a ti que obviamente no es tuya, necesitas medirla para saber si es de un hombre o una mujer.`
                    opcion = 1
                } else {
                    speakOutput = `Scraps te guía hacia algo que está colgando de una rama, te acercas y observas que es un pedazo de tela, al parecer es de una blusa de mujer. Se escucha que algo se está moviendo entre la hierba y Scraps le empieza a ladrar ferozmente.`
                    opcion = 2
                }
                
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
}

const HelloWorldIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HelloWorldIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Hello World!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};


const IniciarIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'IniciarIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Hello World!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speakOutput = 'Goodbye!';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .getResponse();
    }
};
/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ingnored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speakOutput = 'Sorry, I don\'t know about that. Please try again.';

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};
/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`~~~~ Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse(); // notice we send an empty response
    }
};
/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speakOutput = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speakOutput)
            //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    }
};
/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
        console.log(`~~~~ Error handled: ${JSON.stringify(error)}`);

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .reprompt(speakOutput)
            .getResponse();
    }
};

/**
 * This handler acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom 
 * */
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        YesIntentHandler,
        ObjetoIntentHandler,
        HelloWorldIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler)
    .addErrorHandlers(
        ErrorHandler)
    .addRequestInterceptors(LoadAttributesRequestInterceptor)
    .addResponseInterceptors(SaveAttributesResponseInterceptor)
    .withCustomUserAgent('sample/hello-world/v1.2')
    .withPersistenceAdapter(persistenceAdapter)
    .lambda();