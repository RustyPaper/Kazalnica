<template>
  <div class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal">
      <div class="modal-header">
        <h3 class="modal-title">{{ title }}</h3>
        <button class="modal-close" @click="$emit('cancel')">&times;</button>
      </div>
      
      <p style="margin: 20px 0;">{{ message }}</p>
      
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button class="btn btn-secondary" @click="$emit('cancel')">
          {{ cancelText }}
        </button>
        <button :class="`btn btn-${confirmType}`" @click="$emit('confirm')">
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmType?: 'primary' | 'danger' | 'success';
}

withDefaults(defineProps<Props>(), {
  title: 'Potwierdzenie',
  confirmText: 'Potwierdź',
  cancelText: 'Anuluj',
  confirmType: 'primary',
});

defineEmits<{
  confirm: [];
  cancel: [];
}>();
</script>
