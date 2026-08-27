<!--
  - SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->

<template>
	<ul class="unified-share">
		<!-- Single-recipient share: one row -->
		<SharingEntrySimple
			v-if="isSingle"
			:title="recipients[0].display_name"
			:subtitle="permissionSubtitle">
			<template #avatar>
				<NcAvatar
					:size="32"
					:isNoUser="isNoUserRecipient(recipients[0])"
					:user="isNoUserRecipient(recipients[0]) ? undefined : recipients[0].value"
					:displayName="recipients[0].display_name" />
			</template>
			<NcActionButton :aria-label="t('files_sharing', 'Edit share')" @click="openEditDialog">
				<template #icon>
					<PencilIcon :size="20" />
				</template>
				{{ t('files_sharing', 'Edit share') }}
			</NcActionButton>
			<NcActionButton :aria-label="t('files_sharing', 'Delete share')" @click="confirmDeleteShare">
				<template #icon>
					<DeleteIcon :size="20" />
				</template>
				{{ t('files_sharing', 'Delete share') }}
			</NcActionButton>
		</SharingEntrySimple>

		<!-- Multi-recipient share: collapsible group -->
		<template v-else>
			<SharingEntrySimple
				:title="summaryTitle"
				:subtitle="reshareLine"
				:aria-expanded="expanded">
				<template #avatar>
					<AvatarStack :recipients="recipients" />
				</template>
				<NcActionButton
					:icon="expanded ? 'icon-triangle-n' : 'icon-triangle-s'"
					:aria-label="t('files_sharing', 'Toggle recipients')"
					@click.prevent.stop="expanded = !expanded" />
				<NcActionButton :aria-label="t('files_sharing', 'Edit share')" @click="openEditDialog">
					<template #icon>
						<PencilIcon :size="20" />
					</template>
					{{ t('files_sharing', 'Edit share') }}
				</NcActionButton>
				<NcActionButton :aria-label="t('files_sharing', 'Delete share')" @click="confirmDeleteShare">
					<template #icon>
						<DeleteIcon :size="20" />
					</template>
					{{ t('files_sharing', 'Delete share') }}
				</NcActionButton>
			</SharingEntrySimple>

			<SharingEntrySimple
				v-for="recipient in recipients"
				v-show="expanded"
				:key="recipient.class + recipient.value"
				class="unified-share__recipient"
				:title="recipient.display_name">
				<template #avatar>
					<NcAvatar
						:size="32"
						:isNoUser="isNoUserRecipient(recipient)"
						:user="isNoUserRecipient(recipient) ? undefined : recipient.value"
						:displayName="recipient.display_name" />
				</template>
				<NcActionButton :aria-label="t('files_sharing', 'Remove recipient')" @click="removeOne(recipient)">
					<template #icon>
						<CloseIcon :size="20" />
					</template>
					{{ t('files_sharing', 'Remove recipient') }}
				</NcActionButton>
			</SharingEntrySimple>
		</template>
	</ul>
</template>

<script>
import { DialogBuilder } from '@nextcloud/dialogs'
import { translate as t } from '@nextcloud/l10n'
import NcActionButton from '@nextcloud/vue/components/NcActionButton'
import NcAvatar from '@nextcloud/vue/components/NcAvatar'
import CloseIcon from 'vue-material-design-icons/Close.vue'
import DeleteIcon from 'vue-material-design-icons/Delete.vue'
import PencilIcon from 'vue-material-design-icons/Pencil.vue'
import AvatarStack from './AvatarStack.vue'
import SharingEntrySimple from './SharingEntrySimple.vue'
import { isNoUserRecipient, permissionLabel, recipientSummary, reshareSubtitle } from '../lib/unifiedSharing.ts'
import logger from '../services/logger.ts'
import { openShareEditDialog } from '../services/SharingDialog.ts'
import { deleteShare, removeRecipient } from '../services/unifiedShares.ts'

export default {
	name: 'UnifiedShareEntry',

	components: {
		AvatarStack,
		CloseIcon,
		DeleteIcon,
		NcActionButton,
		NcAvatar,
		PencilIcon,
		SharingEntrySimple,
	},

	props: {
		share: {
			type: Object,
			required: true,
		},

		fileInfo: {
			type: Object,
			required: true,
		},
	},

	emits: ['refresh'],

	data() {
		return {
			expanded: false,
		}
	},

	computed: {
		recipients() {
			return this.share.recipients
		},

		isSingle() {
			return this.recipients.length === 1
		},

		summaryTitle() {
			return recipientSummary(this.recipients)
		},

		permissionSubtitle() {
			return permissionLabel(this.share)
		},

		reshareLine() {
			return reshareSubtitle(this.share)
		},
	},

	methods: {
		t,
		isNoUserRecipient,

		async openEditDialog() {
			try {
				await openShareEditDialog(this.share.id, this.fileInfo.node)
				this.$emit('refresh')
			} catch (error) {
				logger.error('Failed to open the sharing dialog', { error })
			}
		},

		async confirmDeleteShare() {
			if (!await this.confirm(t('files_sharing', 'Are you sure you want to delete this share? This operation cannot be undone.'))) {
				return
			}
			try {
				await deleteShare(this.share.id)
				this.$emit('refresh')
			} catch (error) {
				logger.error('Failed to delete share', { error })
			}
		},

		async removeOne(recipient) {
			try {
				await removeRecipient(this.share.id, recipient.class, recipient.value, recipient.instance)
				this.$emit('refresh')
			} catch (error) {
				logger.error('Failed to remove recipient', { error })
			}
		},

		/**
		 * Show a confirmation dialog and resolve to the user's choice.
		 *
		 * @param {string} text the confirmation prompt
		 * @return {Promise<boolean>}
		 */
		async confirm(text) {
			let confirmed = false
			const dialog = (new DialogBuilder())
				.setName(t('files_sharing', 'Delete share'))
				.setText(text)
				.setButtons([
					{
						label: t('files_sharing', 'Cancel'),
						variant: 'secondary',
						callback: () => {},
					},
					{
						label: t('files_sharing', 'Delete'),
						variant: 'error',
						callback: () => {
							confirmed = true
						},
					},
				])
				.build()
			try {
				await dialog.show()
			} catch (error) {
				logger.debug('Delete confirmation dialog closed', { error })
			}
			return confirmed
		},
	},
}
</script>

<style lang="scss" scoped>
.unified-share {
	&__recipient {
		padding-inline-start: 24px;
	}
}
</style>
