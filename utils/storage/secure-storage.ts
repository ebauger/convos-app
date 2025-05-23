import * as SecureStore from "expo-secure-store"
import { config } from "@/config"

function setSecureItemAsync(key: string, value: string) {
  return SecureStore.setItemAsync(key, value, secureStoreOptions)
}

function getSecureItemAsync(key: string) {
  return SecureStore.getItemAsync(key, secureStoreOptions)
}

function deleteSecureItemAsync(key: string) {
  return SecureStore.deleteItemAsync(key, secureStoreOptions)
}

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  // To make sure we don't have conflicts with other apps
  keychainService: config.app.bundleId,

  // Make sure the data is available after the first unlock
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,

  // Only available to specify in newest expo secure store version but we need to upgrade to Expo SDK 53 to use it
  // accessGroup: `group.${config.app.bundleId}`,
}

export const secureStorage = {
  setItem: setSecureItemAsync,
  getItem: getSecureItemAsync,
  deleteItem: deleteSecureItemAsync,
}
