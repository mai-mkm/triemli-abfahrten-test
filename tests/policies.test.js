import test from 'node:test';import assert from 'node:assert/strict';
import {activityState} from '../js/domain/activity-policy.js';
import {distanceMeters,shouldRefreshNearby,shouldSwitchStation} from '../js/domain/location-policy.js';
test('background always pauses',()=>assert.equal(activityState({visible:false,lastInteraction:0,now:1}),'background'));
test('idle at 60 seconds',()=>assert.equal(activityState({visible:true,lastInteraction:0,now:60000}),'idle'));
test('interaction keeps app active',()=>assert.equal(activityState({visible:true,lastInteraction:50000,now:60000}),'active'));
test('GPS jitter is ignored',()=>assert.equal(shouldRefreshNearby({lat:47.36,lng:8.5},{lat:47.36001,lng:8.5,accuracy:10}),false));
test('movement triggers refresh',()=>assert.equal(shouldRefreshNearby({lat:47.36,lng:8.5},{lat:47.361,lng:8.5,accuracy:10}),true));
test('inaccurate position ignored',()=>assert.equal(shouldRefreshNearby({lat:47.36,lng:8.5},{lat:47.361,lng:8.5,accuracy:150}),false));
test('station hysteresis',()=>{assert.equal(shouldSwitchStation({id:'a',distance:60},{id:'b',distance:35},20000),false);assert.equal(shouldSwitchStation({id:'a',distance:70},{id:'b',distance:35},20000),true)});
test('switch cooldown',()=>assert.equal(shouldSwitchStation({id:'a',distance:70},{id:'b',distance:35},20000,15000),false));
test('distance in meters',()=>assert.ok(distanceMeters({lat:47.36,lng:8.5},{lat:47.361,lng:8.5})>100));

import {createTab,restoreSavedTabs} from '../js/domain/tab-state.js';
test('tabs independent after restoration',()=>{const t=restoreSavedTabs({gps:{selected:{id:'a',name:'A'}},manual:{selected:{id:'b',name:'B'},stops:[{id:'b',name:'B'}]}});assert.equal(t.gps.selected.id,'a');assert.equal(t.manual.selected.id,'b');t.gps.selected.id='c';assert.equal(t.manual.selected.id,'b')});
test('malformed stored state is sanitized',()=>{const t=restoreSavedTabs({gps:{index:-3,stops:[{}, {id:'1',name:'One'}],mapOpen:1},manual:null});assert.equal(t.gps.index,0);assert.equal(t.gps.stops.length,1);assert.equal(t.manual.selected,null)});
