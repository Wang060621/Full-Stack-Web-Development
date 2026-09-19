<script setup>
import { computed } from 'vue';
import pocketWatch from '../assets/antiques/pocket-watch.webp';
import foldingCamera from '../assets/antiques/folding-camera.webp';
import typewriter from '../assets/antiques/typewriter.webp';
import valveRadio from '../assets/antiques/valve-radio.webp';
import operaGlasses from '../assets/antiques/opera-glasses.webp';
import travelTrunk from '../assets/antiques/travel-trunk.webp';
import terrestrialGlobe from '../assets/antiques/terrestrial-globe.webp';
import musicBox from '../assets/antiques/music-box.webp';
import porcelainTeaSet from '../assets/antiques/porcelain-tea-set.webp';
import brassCompass from '../assets/antiques/brass-compass.webp';
import gramophone from '../assets/antiques/gramophone.webp';

const props = defineProps({
  itemId: { type: [Number, String], required: true },
  alt: { type: String, default: '' },
  eager: { type: Boolean, default: false }
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

const coverSource = computed(() => {
  const itemId = Math.max(1, Math.abs(Number(props.itemId) || 1));
  return antiqueCovers[(itemId - 1) % antiqueCovers.length];
});
</script>

<template>
  <span
    class="record-cover"
    :class="`cover-${(Math.max(1, Math.abs(Number(itemId) || 1)) - 1) % 11}`"
  >
    <img
      class="record-cover-image"
      :src="coverSource"
      :alt="alt"
      width="1280"
      height="1280"
      :loading="eager ? 'eager' : 'lazy'"
      :fetchpriority="eager ? 'high' : 'auto'"
      decoding="async"
    />
    <span class="record-cover-glint" aria-hidden="true" />
  </span>
</template>
