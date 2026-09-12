<script setup>
import { computed } from 'vue';
import coverAtlas from '../assets/record-cover-atlas.png';
import vinylFeature from '../assets/vinyl-placeholder.webp';

const props = defineProps({
  itemId: { type: [Number, String], required: true },
  alt: { type: String, default: '' }
});

const coverStyle = computed(() => {
  const coverIndex = (Math.max(1, Math.abs(Number(props.itemId) || 1)) - 1) % 10;
  if (coverIndex === 9) {
    return {
      backgroundImage: `url(${vinylFeature})`,
      backgroundPosition: 'center',
      backgroundSize: 'cover'
    };
  }
  const column = coverIndex % 3;
  const row = Math.floor(coverIndex / 3);
  const positions = ['0%', '50%', '100%'];

  return {
    backgroundImage: `url(${coverAtlas})`,
    backgroundPosition: `${positions[column]} ${positions[row]}`
  };
});
</script>

<template>
  <span
    class="record-cover"
    :class="`cover-${(Math.max(1, Math.abs(Number(itemId) || 1)) - 1) % 10}`"
    :style="coverStyle"
    :role="alt ? 'img' : undefined"
    :aria-label="alt || undefined"
  >
    <span class="record-cover-glint" aria-hidden="true" />
  </span>
</template>
