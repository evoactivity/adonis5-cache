import test from 'japa'
import { AdonisApplication } from '../test-helpers/TestAdonisApp'
import AdonisCacheProvider from '../providers/AdonisCacheProvider'
import { CacheManagerContract, CacheConfig } from '@ioc:Adonis/Addons/Adonis5-Cache'

import InMemoryStorage from '../src/CacheStorages/InMemoryStorage'
import { anything, instance, mock, objectContaining, verify } from 'ts-mockito'
import Config from '@ioc:Adonis/Core/Config'

const cacheConfig: CacheConfig = {
	recordTTL: 1000,
	currentCacheStorage: 'test-storage',
	enabledCacheStorages: [],
	cacheKeyPrefix: '',
}

test.group('Adonis cache provider - test cache manager API', (group) => {
	let adonisApp: AdonisApplication
	let cacheManager: CacheManagerContract

	group.before(async () => {
		adonisApp = new AdonisApplication()
		await adonisApp
			.registerProvider(AdonisCacheProvider)
			.registerAppConfig({ configName: 'cache', appConfig: cacheConfig })
			.loadApp()

		cacheManager = adonisApp.iocContainer.use('Adonis/Addons/Adonis5-Cache')
	})

	test('should get value from default cache storage', async () => {
		const testKey = 'testKey'
		const storageName = 'mocked-in-memory-store'

		const mockedStorage: InMemoryStorage = mock(InMemoryStorage)
		cacheManager.registerStorage(storageName, instance(mockedStorage))
		cacheManager.enableStorage(storageName)

		await cacheManager.get(testKey)

		verify(mockedStorage.get(anything(), testKey)).once()
	}).timeout(0)

	test('should get value from selected cache storage', async () => {
		const testKey = 'testKey'
		const storageName = 'mocked-in-memory-store'

		const mockedStorage: InMemoryStorage = mock(InMemoryStorage)
		cacheManager
			.registerStorage(storageName, instance(mockedStorage))
			.registerStorage('default-storage', {} as any)
			.enableStorage('default-storage')

		await cacheManager.viaStorage(storageName).get(testKey)

		verify(mockedStorage.get(anything(), testKey)).once()
	}).timeout(0)

	test('should return value from correct storage after several storage toggling', async () => {
		const testKey = 'testKey'
		const storageName = 'mocked-in-memory-store'

		const mockedStorage: InMemoryStorage = mock(InMemoryStorage)
		cacheManager
			.registerStorage(storageName, instance(mockedStorage))
			.registerStorage('default-storage', {} as any)
			.enableStorage(storageName)
			.enableStorage('default-storage')
			.enableStorage(storageName)

		await cacheManager.get(testKey)

		verify(mockedStorage.get(anything(), testKey)).once()
	}).timeout(0)

	test('should return value from storage using selected context', async () => {
		const testKey = 'testKey'
		const storageName = 'mocked-in-memory-store'
		const fakeContext = 'fake-context'

		const mockedStorage: InMemoryStorage = mock(InMemoryStorage)
		cacheManager
			.registerStorage(storageName, instance(mockedStorage))
			.registerContext(fakeContext, fakeContext as any)

		await cacheManager.viaContext(fakeContext).get(testKey)

		verify(mockedStorage.get(fakeContext as any, testKey)).once()
	}).timeout(0)

	test('should set context as default context', async () => {
		const testKey = 'testKey'
		const storageName = 'mocked-in-memory-store'
		const fakeContext = 'fake-context'

		const mockedStorage: InMemoryStorage = mock(InMemoryStorage)
		cacheManager
			.registerStorage(storageName, instance(mockedStorage))
			.registerContext(fakeContext, fakeContext as any)
			.enableContext(fakeContext)

		await cacheManager.get(testKey)

		verify(mockedStorage.get(fakeContext as any, testKey)).once()
	}).timeout(0)

	test('should call put operation on storage with custom TTL', async () => {
		const testKey = 'testKey'
		const testValue = 'testValue'
		const testTTL = 1000
		const storageName = 'test-storage'

		const mockedStorage: InMemoryStorage = mock(InMemoryStorage)
		cacheManager.registerStorage(storageName, instance(mockedStorage)).enableStorage(storageName)

		await cacheManager.put(testKey, testValue, testTTL)

		verify(mockedStorage.put(anything(), testKey, testValue, testTTL)).once()
	}).timeout(0)

	test('should call put operation on storage with default TTL', async () => {
		const testKey = 'testKey'
		const testValue = 'testValue'
		const storageName = 'test-storage'

		const mockedStorage: InMemoryStorage = mock(InMemoryStorage)
		cacheManager.registerStorage(storageName, instance(mockedStorage)).enableStorage(storageName)

		await cacheManager.put(testKey, testValue)

		verify(mockedStorage.put(anything(), testKey, testValue, cacheConfig.recordTTL)).once()
	}).timeout(0)

	test('should call put many operation on storage with default TTL', async () => {
		const testMap = { a: 1 }
		const storageName = 'test-storage'

		const mockedStorage: InMemoryStorage = mock(InMemoryStorage)
		cacheManager.registerStorage(storageName, instance(mockedStorage)).enableStorage(storageName)

		await cacheManager.putMany(testMap)

		verify(
			mockedStorage.putMany(anything(), objectContaining(testMap), cacheConfig.recordTTL)
		).once()
	}).timeout(0)

	test('should call put many operation on storage with custom TTL', async () => {
		const testMap = { a: 1 }
		const testTTL = 100
		const storageName = 'test-storage'
		const mockedStorage: InMemoryStorage = mock(InMemoryStorage)
		cacheManager.registerStorage(storageName, instance(mockedStorage)).enableStorage(storageName)

		await cacheManager.putMany(testMap, testTTL)

		verify(mockedStorage.putMany(anything(), objectContaining(testMap), testTTL)).once()
	}).timeout(0)

	test('should call get many operation on storage', async () => {
		const testKeys = ['1', '2', '3']
		const storageName = 'test-storage'

		const mockedStorage: InMemoryStorage = mock(InMemoryStorage)
		cacheManager.registerStorage(storageName, instance(mockedStorage)).enableStorage(storageName)

		await cacheManager.getMany(testKeys)

		verify(mockedStorage.getMany(anything(), objectContaining(testKeys))).once()
	}).timeout(0)

	test('should call forget operation on storage', async () => {
		const testKey = 'testKey'
		const storageName = 'test-storage'

		const mockedStorage: InMemoryStorage = mock(InMemoryStorage)
		cacheManager.registerStorage(storageName, instance(mockedStorage)).enableStorage(storageName)

		await cacheManager.forget(testKey)

		verify(mockedStorage.forget(testKey)).once()
	}).timeout(0)

	test('should call flush operation on storage', async () => {
		const storageName = 'test-storage'

		const mockedStorage: InMemoryStorage = mock(InMemoryStorage)
		cacheManager.registerStorage(storageName, instance(mockedStorage)).enableStorage(storageName)

		await cacheManager.flush()

		verify(mockedStorage.flush()).once()
	}).timeout(0)

	test('should add prefix to user key for storage during PUT OPERATION', async () => {
		const storageName = 'mocked-in-memory-store'
		const testKey = 'testKey'
		const testValue = 'testValue'
		const cacheKeyPrefix = 'cachePrefix'

		const config: typeof Config = adonisApp.iocContainer.use('Adonis/Core/Config')

		config.set('cache.cacheKeyPrefix', cacheKeyPrefix)

		const mockedStorage: InMemoryStorage = mock(InMemoryStorage)
		cacheManager.registerStorage(storageName, instance(mockedStorage)).enableStorage(storageName)

		await cacheManager.put(testKey, testValue, cacheConfig.recordTTL)

		verify(
			mockedStorage.put(anything(), cacheKeyPrefix + testKey, testValue, cacheConfig.recordTTL)
		).once()
	}).timeout(0)

	test('should add prefix to user key for storage during GET operation', async () => {
		const storageName = 'mocked-in-memory-store'
		const testKey = 'testKey'
		const cacheKeyPrefix = 'cachePrefix'

		const config: typeof Config = adonisApp.iocContainer.use('Adonis/Core/Config')

		config.set('cache.cacheKeyPrefix', cacheKeyPrefix)

		const mockedStorage: InMemoryStorage = mock(InMemoryStorage)
		cacheManager.registerStorage(storageName, instance(mockedStorage)).enableStorage(storageName)

		await cacheManager.get(testKey)

		verify(mockedStorage.get(anything(), cacheKeyPrefix + testKey)).once()
	}).timeout(0)

	test('should add prefix to user key for storage during PUT MANY operation', async () => {
		const storageName = 'mocked-in-memory-store'
		const testMap = { a: 1 }
		const cacheKeyPrefix = 'cachePrefix'
		const expectedMapWithPrefixes = { [cacheKeyPrefix + 'a']: testMap.a }

		const config: typeof Config = adonisApp.iocContainer.use('Adonis/Core/Config')

		config.set('cache.cacheKeyPrefix', cacheKeyPrefix)

		const mockedStorage: InMemoryStorage = mock(InMemoryStorage)
		cacheManager.registerStorage(storageName, instance(mockedStorage)).enableStorage(storageName)

		await cacheManager.putMany(testMap)

		verify(
			mockedStorage.putMany(
				anything(),
				objectContaining(expectedMapWithPrefixes),
				cacheConfig.recordTTL
			)
		).once()
	}).timeout(0)

	test('should add prefix to user key for storage during GET MANY operation', async () => {
		const storageName = 'mocked-in-memory-store'
		const testKeys = ['key1', 'key2']
		const cacheKeyPrefix = 'cachePrefix'
		const expectedKeysWithPrefixes = testKeys.map((key) => cacheKeyPrefix + key)

		const config: typeof Config = adonisApp.iocContainer.use('Adonis/Core/Config')

		config.set('cache.cacheKeyPrefix', cacheKeyPrefix)

		const mockedStorage: InMemoryStorage = mock(InMemoryStorage)
		cacheManager.registerStorage(storageName, instance(mockedStorage)).enableStorage(storageName)

		await cacheManager.getMany(testKeys)

		verify(mockedStorage.getMany(anything(), objectContaining(expectedKeysWithPrefixes))).once()
	}).timeout(0)

	test('should add prefix to user key for storage during FORGET operation', async () => {
		const storageName = 'mocked-in-memory-store'
		const testKey = 'testKey'
		const cacheKeyPrefix = 'cachePrefix'

		const config: typeof Config = adonisApp.iocContainer.use('Adonis/Core/Config')

		config.set('cache.cacheKeyPrefix', cacheKeyPrefix)

		const mockedStorage: InMemoryStorage = mock(InMemoryStorage)
		cacheManager.registerStorage(storageName, instance(mockedStorage)).enableStorage(storageName)

		await cacheManager.forget(testKey)

		verify(mockedStorage.forget(cacheKeyPrefix + testKey)).once()
	}).timeout(0)
})
