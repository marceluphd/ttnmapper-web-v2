/*
This file contains all sagas that fetch data for map data, such as visible gateways,
gateway positions and coverage maps.
*/
import { call, put, takeLatest, takeEvery} from 'redux-saga/effects'
import { mapConstants } from '../constants'

import * as Api from '../api-calls'

/*
Call the API endpoint to find all gateways in the current viewport
*/
function* requestMapData(action) {
   try {
      const response = yield call(Api.fetchBoundingBoxUrl, action.payload.mapExtent);
      const json = yield response.json();

      yield put({type: mapConstants.RECEIVE_MAP_GATEWAYS, payload:{listOfGateways: json.gateways}});
      yield put({type: mapConstants.SET_VISIBLE_GATEWAYS, payload:{listOfGateways: json.gateways}});

      // We received a new list of visible gateways. Check if we have details/circles/radar for them, if not, request it.
      // We can batch these requests, so create lists.
      let missingGWDetails = []
      let missingGWCircles = []
      let missingGWRadars = []

      for (let i = 0; i < json.gateways.length; i++) {
        // check if we have any details about this gateway
        if (!action.payload.knownGateways.includes(json.gateways[i])){
          // if not, ask for some details.
          missingGWDetails.push(json.gateways[i])
        }

        // Check if we have circle data for this gateway, and if it is required
        if (!action.payload.knownCircles.includes(json.gateways[i])) {
          missingGWCircles.push(json.gateways[i])
        }

        // Check if we have radar data for this gateway, and if it is required
        // Used to have ) && (action.payload.zoomLevel >= 10) in the if, to check zoom levels
        if (!action.payload.knownRadar.includes(json.gateways[i])) {
          missingGWRadars.push(json.gateways[i])
        }
      }

      if (missingGWDetails.length > 0) {
        yield put({type: mapConstants.REQUEST_GATEWAY_DETAILS, payload: {list: missingGWDetails}});
      }
      if (missingGWCircles.length > 0) {
        yield put({type: mapConstants.REQUEST_MAP_GW_CIRCLES, payload: {list: missingGWCircles}});
      }
      if (missingGWRadars.length > 0) {
        yield put({type: mapConstants.REQUEST_MAP_GW_RADAR, payload: {list: missingGWRadars}});
      }

   } catch (e) {
      yield put({type: mapConstants.RECEIVE_MAP_GATEWAYS_FAILED, message: e.message});
   }
}

/*
Call the API endpoint to find details about a specific gateway
*/
function* requestGatewayDetails(action) {
  try {
    const response = yield call(Api.fetchGWDetailsList, action.payload.list);
    const json = yield response.json();

    yield put({
      type: mapConstants.RECEIVE_GATEWAY_DETAILS,
      payload: {
        listOfGateways: json
      }
    });
  } catch (e) {
    yield put({
      type: mapConstants.RECEIVE_GATEWAY_DETAILS_FAILED,
      message: e.message,
      payload: {
      }
    });
  }
}

/*
Call the API endpoint to find circle coverage
*/
function* requestGatewayCircles(action) {
  try {
    const response = yield call(Api.fetchGWCirclesList, action.payload.list);
    const json = yield response.json();

    yield put({
      type: mapConstants.RECEIVE_MAP_GW_CIRCLES,
      payload:{
        listOfGateways: json
      }
    });
  } catch (e) {
    yield put({
      type: mapConstants.RECEIVE_MAP_GW_CIRCLES_FAILED,
      message: e.message,
      payload: {
      }
    });
  }
}

/*
Call the API endpoint to find radar coverage
*/
function* requestGatewayRadar(action) {
  try {
    const response = yield call(Api.fetchGWRadarsList, action.payload.list);
    const json = yield response.json();

    yield put({
      type: mapConstants.RECEIVE_MAP_GW_RADAR,
      payload: {
        listOfGateways: json
      }
    });
  } catch (e) {
    yield put({
      type: mapConstants.RECEIVE_MAP_GW_RADAR_FAILED,
      message: e.message,
      payload: {
      }
    });
  }
}

/*
Call the API endpoint to find alpha coverage
*/
function* requestGatewayAlpha(action) {
  try {
    const response = yield call(Api.fetchGWAlphaShape, action.payload.gatewayID);
    const json = yield response.json();

    yield put({
      type: mapConstants.RECEIVE_MAP_GW_ALPHA,
      payload: {
        gatewayID: action.payload.gatewayID,
        geoJson: json
      }
    });
  } catch (e) {
    yield put({
      type: mapConstants.RECEIVE_MAP_GW_ALPHA_FAILED,
      message: e.message,
      payload: {
      }
    });
  }
}

/*
Get the packets recived for a specific device
*/
function* requestPacketDetails(action) {
  try {
    const dateRange = {'start':action.payload.fromDate, 'end': action.payload.toDate}

    const response = yield call(Api.fetchPacketData, action.payload.deviceID, dateRange);
    const json = yield response.json();

    yield put({
      type: mapConstants.RECEIVE_PACKETS_DETAILS,
      payload: {
        packetRequest: {
          ...action.patload
        },
        packetData: json
      }
    });

    // Calculate all the gateways we require
    let requiredGateways = {}
    for (let i = 0; i < json.length; i++) {
      requiredGateways[json[i].gwaddr] = 1
    }
    requiredGateways = Object.keys(requiredGateways);

    yield put({ type: mapConstants.REQUEST_GATEWAY_DETAILS, payload: {list: requiredGateways}});
    yield put({type: mapConstants.SET_VISIBLE_GATEWAYS, payload:{listOfGateways: requiredGateways}});

  } catch (e) {
    yield put({
      type: mapConstants.RECEIVE_PACKETS_DETAILS_FAILED,
      message: e.message,
      payload: {
      }
    });
  }
}


function* mapDataSagas() {
  // Take only the latest one, in cae two move events occur
  yield takeLatest(mapConstants.REQUEST_MAP_GATEWAYS, requestMapData);
  // Take all the gateway events, there will be many.
  yield takeEvery(mapConstants.REQUEST_GATEWAY_DETAILS, requestGatewayDetails);
  yield takeEvery(mapConstants.REQUEST_MAP_GW_CIRCLES, requestGatewayCircles);
  yield takeEvery(mapConstants.REQUEST_MAP_GW_RADAR, requestGatewayRadar);
  yield takeEvery(mapConstants.REQUEST_MAP_GW_ALPHA, requestGatewayAlpha);
  yield takeEvery(mapConstants.REQUEST_PACKETS_DETAILS, requestPacketDetails);
}

export { mapDataSagas };
