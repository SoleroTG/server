<!--
  - SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<div class="avatar-stack">
		<NcAvatar
			v-for="recipient in displayed"
			:key="recipient.class + recipient.value"
			class="avatar-stack__avatar"
			:size="32"
			:isNoUser="isNoUserRecipient(recipient)"
			:user="isNoUserRecipient(recipient) ? undefined : recipient.value"
			:displayName="recipient.display_name"
			disableMenu
			disableTooltip />
		<span v-if="overflow > 0" class="avatar-stack__overflow" :aria-hidden="true">
			+{{ overflow }}
		</span>
	</div>
</template>

<script>
import NcAvatar from '@nextcloud/vue/components/NcAvatar'
import { isNoUserRecipient } from '../lib/unifiedSharing.ts'

const MAX_AVATARS = 3

export default {
	name: 'AvatarStack',

	components: {
		NcAvatar,
	},

	props: {
		recipients: {
			type: Array,
			required: true,
		},
	},

	computed: {
		displayed() {
			return this.recipients.slice(0, MAX_AVATARS)
		},

		overflow() {
			return Math.max(0, this.recipients.length - MAX_AVATARS)
		},
	},

	methods: {
		isNoUserRecipient,
	},
}
</script>

<style lang="scss" scoped>
.avatar-stack {
	display: flex;
	align-items: center;

	&__avatar {
		// Ring via box-shadow (not border) so the avatar stays exactly 32px,
		// matching the avatars in the other entries.
		box-shadow: 0 0 0 2px var(--color-main-background);
		border-radius: 50%;

		&:not(:first-child) {
			margin-inline-start: -12px;
		}
	}

	&__overflow {
		margin-inline-start: 4px;
		color: var(--color-text-maxcontrast);
		font-size: 12px;
	}
}
</style>
