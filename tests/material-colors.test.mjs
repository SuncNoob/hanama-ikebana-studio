import test from 'node:test';
import assert from 'node:assert/strict';
import {materialColorGroups,matchesMaterialColor} from '../dist/material-colors.js';
import {newSpecimens} from '../dist/catalog.js';
import {photoSpecimens} from '../dist/photo-catalog.js';
import {foliageSpecimens} from '../dist/foliage-catalog.js';
import {studySpecimens} from '../dist/study-catalog.js';
import {poseSpecimens} from '../dist/pose-catalog.js';
import {additionalPoseSpecimens} from '../dist/additional-pose-catalog.js';

const specimens=[...photoSpecimens,...newSpecimens,...foliageSpecimens,...studySpecimens,...poseSpecimens,...additionalPoseSpecimens];

test('every material color category includes real catalog specimens',()=>{
  for(const group of materialColorGroups){
    assert.ok(specimens.some(specimen=>matchesMaterialColor(specimen,group.id)),group.id);
  }
  for(const specimen of specimens){
    assert.ok(materialColorGroups.some(group=>matchesMaterialColor(specimen,group.id)),specimen.id);
  }
});

test('color lookup includes alternate poses and mixed-color flowers',()=>{
  assert.ok(newSpecimens.some(specimen=>specimen.family==='chrysanthemum'&&matchesMaterialColor(specimen,'red')));
  assert.ok(newSpecimens.some(specimen=>specimen.family==='chrysanthemum'&&matchesMaterialColor(specimen,'white')));
  const mixed={color:'白底紫斑',colorEn:'ivory with burgundy speckles'};
  assert.equal(matchesMaterialColor(mixed,'white'),true);
  assert.equal(matchesMaterialColor(mixed,'purple'),true);
  assert.equal(matchesMaterialColor(mixed,'red'),true);
  assert.equal(matchesMaterialColor(mixed,'green'),false);
});
