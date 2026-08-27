<!--
  - SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="unified-share-list">
		<UnifiedShareEntry
			v-for="share in sortedShares"
			:key="share.id"
			:share="share"
			:fileInfo="fileInfo"
			@refresh="$emit('refresh')" />
	</div>
</template>

<script>
import UnifiedShareEntry from './UnifiedShareEntry.vue'
import { sortSharesByPermission } from '../lib/unifiedSharing.ts'

export default {
	name: 'UnifiedShareList',

	components: {
		UnifiedShareEntry,
	},

	props: {
		shares: {
			type: Array,
			required: true,
		},

		fileInfo: {
			type: Object,
			required: true,
		},
	},

	emits: ['refresh'],

	computed: {
		sortedShares() {
			return sortSharesByPermission(this.shares)
		},
	},
}
</script>
