/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { SharingPermission, SharingRecipient, SharingShare } from '../types/unifiedSharing.ts'

import { describe, expect, test, vi } from 'vitest'
import {
	RECIPIENT_TYPE_GROUP,
	RECIPIENT_TYPE_USER,
} from './unifiedSharingConstants.ts'
import {
	isNoUserRecipient,
	permissionLabel,
	recipientSummary,
	reshareSubtitle,
	sharePermissionRank,
	sortSharesByPermission,
} from './unifiedSharing.ts'

vi.mock('@nextcloud/l10n', () => ({
	translate: (_app: string, text: string) => text,
	translatePlural: (_app: string, singular: string, plural: string, count: number) =>
		(count === 1 ? singular : plural).replace('%n', String(count)),
}))

vi.mock('@nextcloud/capabilities', () => ({
	getCapabilities: () => ({
		sharing: {
			permission_presets: [
				{ class: 'PresetView', display_name: 'Can view' },
				{ class: 'PresetEdit', display_name: 'Can edit' },
			],
		},
	}),
}))

const permission = (cls: string, priority: number, enabled: boolean): SharingPermission => ({
	class: cls,
	source_class: null,
	display_name: cls,
	hint: null,
	priority,
	presets: [],
	enabled,
})

const recipient = (cls: string, value: string, initiator: SharingRecipient['initiator'] = null): SharingRecipient => ({
	class: cls,
	value,
	instance: null,
	display_name: value,
	icon: null,
	secret: { updatable: false },
	initiator,
})

const share = (overrides: Partial<SharingShare> = {}): SharingShare => ({
	id: '1',
	owner: { user_id: 'alice', instance: null, display_name: 'Alice', icon: { svg: '' } },
	last_updated: 0,
	state: 'active',
	sources: [],
	recipients: [],
	permissions: [],
	permission_preset: null,
	...overrides,
})

describe('sharePermissionRank', () => {
	test('sums priorities of enabled permissions only', () => {
		const s = share({
			permissions: [permission('read', 1, true), permission('write', 4, true), permission('share', 16, false)],
		})
		expect(sharePermissionRank(s)).toBe(5)
	})
})

describe('sortSharesByPermission', () => {
	test('orders by rank desc, then recipient count, then id', () => {
		const low = share({ id: 'a', permissions: [permission('read', 1, true)] })
		const high = share({ id: 'b', permissions: [permission('read', 1, true), permission('write', 4, true)] })
		const highMoreRecipients = share({
			id: 'c',
			permissions: [permission('read', 1, true), permission('write', 4, true)],
			recipients: [recipient(RECIPIENT_TYPE_USER, 'bob'), recipient(RECIPIENT_TYPE_USER, 'carol')],
		})
		const sorted = sortSharesByPermission([low, high, highMoreRecipients])
		expect(sorted.map((s) => s.id)).toEqual(['c', 'b', 'a'])
	})

	test('does not mutate the input', () => {
		const input = [share({ id: 'a' }), share({ id: 'b' })]
		sortSharesByPermission(input)
		expect(input.map((s) => s.id)).toEqual(['a', 'b'])
	})
})

describe('isNoUserRecipient', () => {
	test('true for non-user classes, false for users', () => {
		expect(isNoUserRecipient(recipient(RECIPIENT_TYPE_GROUP, 'devs'))).toBe(true)
		expect(isNoUserRecipient(recipient(RECIPIENT_TYPE_USER, 'bob'))).toBe(false)
	})
})

describe('recipientSummary', () => {
	test('counts and pluralizes by category', () => {
		const recipients = [
			recipient(RECIPIENT_TYPE_USER, 'bob'),
			recipient(RECIPIENT_TYPE_GROUP, 'devs'),
			recipient(RECIPIENT_TYPE_GROUP, 'ops'),
		]
		expect(recipientSummary(recipients)).toBe('1 person, 2 groups')
	})
})

describe('permissionLabel', () => {
	test('returns the preset display name', () => {
		expect(permissionLabel(share({ permission_preset: 'PresetEdit' }))).toBe('Can edit')
	})

	test('returns Custom permissions when no preset matches', () => {
		expect(permissionLabel(share({ permission_preset: null }))).toBe('Custom permissions')
		expect(permissionLabel(share({ permission_preset: 'Unknown' }))).toBe('Custom permissions')
	})
})

describe('reshareSubtitle', () => {
	test('counts recipients added by someone other than the owner', () => {
		const initiator = { user_id: 'bob', instance: null, display_name: 'Bob', icon: { svg: '' } }
		const s = share({
			recipients: [
				recipient(RECIPIENT_TYPE_USER, 'carol', initiator),
				recipient(RECIPIENT_TYPE_USER, 'dave'),
			],
		})
		expect(reshareSubtitle(s)).toBe('Reshared with 1 person')
	})

	test('empty when no reshares', () => {
		expect(reshareSubtitle(share({ recipients: [recipient(RECIPIENT_TYPE_USER, 'bob')] }))).toBe('')
	})
})
