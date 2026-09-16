<script setup>
import { computed } from 'vue';
import pocketWatch from '../assets/antiques/pocket-watch.jpg';
import foldingCamera from '../assets/antiques/folding-camera.jpg';
import typewriter from '../assets/antiques/typewriter.jpg';
import valveRadio from '../assets/antiques/valve-radio.jpg';
import operaGlasses from '../assets/antiques/opera-glasses.jpg';
import travelTrunk from '../assets/antiques/travel-trunk.jpg';
import terrestrialGlobe from '../assets/antiques/terrestrial-globe.jpg';
import musicBox from '../assets/antiques/music-box.jpg';
import porcelainTeaSet from '../assets/antiques/porcelain-tea-set.jpg';
import brassCompass from '../assets/antiques/brass-compass.jpg';
import gramophone from '../assets/antiques/gramophone.jpg';

const props = defineProps({
  itemId: { type: [Number, String], required: true },
  alt: { type: String, default: '' }
});

const antiqueCovers = [
  pocketWatch,
  foldingCamera,
  typewriter,
  valveRadio,
  operaGlasses,
  travelTrunk,
  terrestrialGlobe,
  musicBox,
  porcelainTeaSet,
  brassCompass,
  gramophone
];

const coverStyle = computed(() => {
  const itemId = Math.max(1, Math.abs(Number(props.itemId) || 1));
  const cover = antiqueCovers[(itemId - 1) % antiqueCovers.length];

  return {
    backgroundImage: `url(${cover})`,
    backgroundPosition: 'center',
    backgroundSize: 'cover'
  };
});
</script>

<template>
  <span
    class="record-cover"
    :class="`cover-${(Math.max(1, Math.abs(Number(itemId) || 1)) - 1) % 11}`"
    :style="coverStyle"
    :role="alt ? 'img' : undefined"
    :aria-label="alt || undefined"
  >
    <span class="record-cover-glint" aria-hidden="true" />
  </span>
</template>
