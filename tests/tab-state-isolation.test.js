import test from 'node:test';
import assert from 'node:assert/strict';
import { createTab, restoreSavedTabs, serializeSavedTabs } from '../js/domain/tab-state.js';

test('new tabs do not share mutable arrays', () => {
  const a = createTab(), b = createTab();
  a.stops.push({ id: '1', name: 'A' });
  assert.equal(b.stops.length, 0);
});

test('saved GPS and manual tab selections remain independent', () => {
  const tabs = restoreSavedTabs({
    gps: { selected: { id: '1', name: 'GPS' }, stops: [{ id: '1', name: 'GPS' }], index: 0 },
    manual: { selected: { id: '2', name: 'Manual' }, stops: [{ id: '2', name: 'Manual' }], index: 0, manualLocation: 'Zürich' }
  });
  tabs.gps.stops[0].name = 'Changed';
  assert.equal(tabs.manual.stops[0].name, 'Manual');
  assert.equal(tabs.manual.manualLocation, 'Zürich');
  assert.equal(tabs.gps.selected.id, '1');
  assert.equal(tabs.manual.selected.id, '2');
});

test('restored index is clamped to available stations', () => {
  const tabs = restoreSavedTabs({ manual: { stops: [{ id: '1', name: 'One' }], index: 99 } });
  assert.equal(tabs.manual.index, 0);
});

test('invalid persisted state safely falls back to defaults', () => {
  assert.deepEqual(restoreSavedTabs(null), { gps: createTab(), manual: createTab() });
  assert.equal(restoreSavedTabs({ gps: { stops: [], index: -2 } }).gps.index, 0);
});

test('transient map and GPS state is not restored', () => {
  const tabs = restoreSavedTabs({ gps: { mapData: { stale: true }, mapOpen: true, origin: { lat: 1 }, lastSwitch: 100 } });
  assert.equal(tabs.gps.mapData, null);
  assert.equal(tabs.gps.mapOpen, false);
  assert.equal(tabs.gps.origin, null);
  assert.equal(tabs.gps.lastSwitch, 0);
});

test('persisted state excludes GPS coordinates and map objects', () => {
  const tabs = restoreSavedTabs(null);
  tabs.gps.selected = { id: '8503610', name: 'Triemli' };
  tabs.gps.stops = [{ id: '8503610', name: 'Triemli', lat: 47.3, lng: 8.5, distance: 20 }];
  tabs.gps.origin = { lat: 47.3, lng: 8.5 };
  tabs.gps.mapData = { origin: tabs.gps.origin };
  tabs.manual.manualLocation = 'Zürich';
  const serialized = JSON.stringify(serializeSavedTabs(tabs));
  assert.equal(serialized.includes('47.3'), false);
  assert.equal(serialized.includes('8.5'), false);
  assert.equal(serialized.includes('mapData'), false);
  assert.equal(serialized.includes('origin'), false);
  const restored = restoreSavedTabs(JSON.parse(serialized));
  assert.equal(restored.gps.selected.id, '8503610');
  assert.equal(restored.manual.manualLocation, 'Zürich');
});

test('serialization limits stations to ten and clamps selection', () => {
  const tabs = { gps: createTab(), manual: createTab() };
  tabs.manual.stops = Array.from({ length: 14 }, (_, i) => ({ id: String(i), name: 'Stop ' + i }));
  tabs.manual.index = 13;
  const saved = serializeSavedTabs(tabs);
  assert.equal(saved.manual.stops.length, 10);
  assert.equal(saved.manual.index, 9);
  assert.equal(restoreSavedTabs(saved).manual.index, 9);
});

test('serialization tolerates missing or malformed tab records', () => {
  const saved = serializeSavedTabs({ gps: { stops: null, index: -5 } });
  assert.deepEqual(saved.gps.stops, []);
  assert.equal(saved.gps.index, 0);
  assert.equal(saved.manual.manualLocation, '');
});
