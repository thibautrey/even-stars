# @evenrealities/even_hub_sdk

[![npm version](https://img.shields.io/npm/v/@evenrealities/even_hub_sdk.svg)](https://www.npmjs.com/package/@evenrealities/even_hub_sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)

> TypeScript SDK for WebView developers to communicate with Even App

**English** | [中文 (Chinese)](README.zh-CN.md)

> 📝 **Note**: The Chinese documentation (`README.zh-CN.md`) is included in the npm package. After installing the package, you can find it in `node_modules/@evenrealities/even_hub_sdk/README.zh-CN.md`. The npm website only displays the main `README.md` file.

## 📑 Table of Contents

- [Introduction](#-introduction)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
  - [Basic Usage](#basic-usage)
  - [Device Status Monitoring](#device-status-monitoring)
  - [Creating Glasses UI](#creating-glasses-ui)
  - [Event Listening](#event-listening)
- [API Documentation](#-api-documentation)
  - [EvenAppBridge](#evenappbridge)
  - [Data Models](#data-models)
  - [Enum Types](#enum-types)
- [Advanced Usage](#-advanced-usage)
- [Notes](#-notes)
- [Contributing](#-contributing)
- [Contact](#-contact)
- [Changelog](#-changelog)
- [License](#-license)

## 📖 Introduction

`@evenrealities/even_hub_sdk` is a TypeScript SDK designed for the Even App ecosystem, enabling bidirectional communication between Web pages and the Even App in WebView environments. This SDK provides type-safe bridge interfaces supporting device information management, user information retrieval, local storage operations, and core EvenHub protocol functionality.

### Key Features

- 🔌 **Unified Bridge Encapsulation**: Provides `EvenAppBridge` class for type-safe communication between Web and App
- 📱 **Device Management**: Get device information and monitor device status changes (connection status, battery level, wearing status, etc.)
- 👤 **User Information**: Retrieve current logged-in user information
- 💾 **Local Storage**: Provides key-value storage interface with data persistence on the App side
- 🎯 **EvenHub Protocol Support**: Full support for core EvenHub protocol calls (JSON field mapping)
- 📡 **Event Listening**: Supports real-time push notifications for device status changes and EvenHub events
- 🛡️ **Type Safety**: Complete TypeScript type definitions for excellent developer experience
- 🔄 **Auto Initialization**: SDK automatically initializes the bridge without manual configuration

## 📦 Version Information

- **Current Version**: `0.0.6`
- **Node.js Requirement**: `^20.0.0 || >=22.0.0`
- **TypeScript Support**: Full support with type definition files included

## 🚀 Installation

Install using npm:

```bash
npm install @evenrealities/even_hub_sdk
```

Or using yarn:

```bash
yarn add @evenrealities/even_hub_sdk
```

Or using pnpm:

```bash
pnpm add @evenrealities/even_hub_sdk
```

## ⚡ Quick Start

### Basic Usage

```typescript
import { waitForEvenAppBridge } from '@evenrealities/even_hub_sdk';

// Wait for bridge initialization
const bridge = await waitForEvenAppBridge();

// Get user information
const user = await bridge.getUserInfo();
console.log('User:', user.name);

// Get device information
const device = await bridge.getDeviceInfo();
console.log('Device Model:', device?.model);

// Local storage operations
await bridge.setLocalStorage('theme', 'dark');
const theme = await bridge.getLocalStorage('theme');
```

### Device Status Monitoring

```typescript
import { waitForEvenAppBridge, DeviceConnectType } from '@evenrealities/even_hub_sdk';

const bridge = await waitForEvenAppBridge();

const unsubscribe = bridge.onDeviceStatusChanged((status) => {
  if (status.connectType === DeviceConnectType.Connected) {
    console.log('Device connected!', status.batteryLevel);
  }
});

// unsubscribe();
```

### Creating Glasses UI

> ⚠️ **Important**: You **must** call `createStartUpPageContainer` first before any other UI operations.

```typescript
import {
  waitForEvenAppBridge,
  CreateStartUpPageContainer,
  ListContainerProperty,
  TextContainerProperty,
} from '@evenrealities/even_hub_sdk';

const bridge = await waitForEvenAppBridge();

// Create containers
const listContainer: ListContainerProperty = {
  xPosition: 100,
  yPosition: 50,
  width: 200,
  height: 150,
  containerID: 1,
  containerName: 'list-1',
  itemContainer: {
    itemCount: 3,
    itemName: ['Item 1', 'Item 2', 'Item 3'],
  },
  isEventCapture: 1, // Only one container can have isEventCapture=1
};

const textContainer: TextContainerProperty = {
  xPosition: 100,
  yPosition: 220,
  width: 200,
  height: 50,
  containerID: 2,
  containerName: 'text-1',
  content: 'Hello World',
  isEventCapture: 0,
};

// Create startup page (max 4 containers)
const result = await bridge.createStartUpPageContainer({
  containerTotalNum: 2, // Maximum: 4
  listObject: [listContainer],
  textObject: [textContainer],
});

if (result === 0) {
  // Update image data if needed
  // await bridge.updateImageRawData({ ... });
  
  // Update text content if needed
  // await bridge.textContainerUpgrade({ ... });
}
```

### Event Listening

```typescript
const bridge = await waitForEvenAppBridge();

const unsubscribe = bridge.onEvenHubEvent((event) => {
  if (event.listEvent) {
    console.log('List selected:', event.listEvent.currentSelectItemName);
  } else if (event.textEvent) {
    console.log('Text event:', event.textEvent);
  } else if (event.sysEvent) {
    console.log('System event:', event.sysEvent.eventType);
  } else if (event.audioEvent) {
    console.log('Audio PCM length:', event.audioEvent.audioPcm.length);
  }
});

// unsubscribe();
```

### Audio Control and Event

Use `audioControl(isOpen)` to turn the microphone on or off. When the host pushes audio data, it is delivered as an **audioEvent** in `onEvenHubEvent` with PCM bytes in `event.audioEvent.audioPcm` (a `Uint8Array`). PCM parameters: **dtUs** 10000 µs (frame length), **srHz** 16kHz (sample rate), **40 bytes per frame**, **little-endian** byte order.

```typescript
const bridge = await waitForEvenAppBridge();

// Open microphone (start receiving audio)
await bridge.audioControl(true);

// Listen for audio events (PCM: dtUs 10000 µs, srHz 16kHz, 40 bytes/frame, little-endian)
const unsubscribe = bridge.onEvenHubEvent((event) => {
  if (event.audioEvent) {
    const pcm = event.audioEvent.audioPcm; // Uint8Array
    console.log('Audio PCM length:', pcm.length);
    // Play PCM with Web Audio API (10000 µs frame, 16kHz, 40 bytes/frame, little-endian)
  }
});

// Close microphone when done
// await bridge.audioControl(false);
// unsubscribe();
```

## 📚 API Documentation

### EvenAppBridge

The main bridge class that provides all methods for communicating with Even App.

#### Getting Started

##### Get Instance

```typescript
import { EvenAppBridge, waitForEvenAppBridge } from '@evenrealities/even_hub_sdk';

// Method 1: Wait for bridge ready (recommended)
const bridge = await waitForEvenAppBridge();

// Method 2: Get singleton directly (ensure it's initialized)
const bridge = EvenAppBridge.getInstance();
```

#### Basic Information Methods

##### `getUserInfo(): Promise<UserInfo>`

Get current logged-in user information.

**Returns**: `Promise<UserInfo>`

**Example**:
```typescript
const user = await bridge.getUserInfo();
console.log(user.name);
console.log(user.uid);
console.log(user.avatar);
console.log(user.country);
```

##### `getDeviceInfo(): Promise<DeviceInfo | null>`

Get device information (glasses/ring information).

**Returns**: `Promise<DeviceInfo | null>`

**Example**:
```typescript
const device = await bridge.getDeviceInfo();
if (device) {
  console.log('Model:', device.model);
  console.log('SN:', device.sn);
  console.log('Status:', device.status);
}
```

##### `setLocalStorage(key: string, value: string): Promise<boolean>`

Set local storage value.

**Parameters**:
- `key: string` - Storage key name
- `value: string` - Storage value

**Returns**: `Promise<boolean>` - Whether the operation succeeded

**Example**:
```typescript
await bridge.setLocalStorage('theme', 'dark');
await bridge.setLocalStorage('language', 'en-US');
```

##### `getLocalStorage(key: string): Promise<string>`

Get local storage value.

**Parameters**:
- `key: string` - Storage key name

**Returns**: `Promise<string>` - Stored value, returns empty string if not found

**Example**:
```typescript
const theme = await bridge.getLocalStorage('theme');
const language = await bridge.getLocalStorage('language');
```

#### Event Listening Methods

##### `onDeviceStatusChanged(callback: (status: DeviceStatus) => void): () => void`

Listen to device status change events.

**Parameters**:
- `callback: (status: DeviceStatus) => void` - Callback function when status changes

**Returns**: `() => void` - Unsubscribe function

**Example**:
```typescript
const unsubscribe = bridge.onDeviceStatusChanged((status) => {
  console.log('Connect Type:', status.connectType);
  console.log('Battery Level:', status.batteryLevel);
  console.log('Is Wearing:', status.isWearing);
  console.log('Is Charging:', status.isCharging);
});

// Unsubscribe
unsubscribe();
```

#### EvenHub API Interfaces

The following interfaces are used for communicating with EvenHub devices.

> **Coordinate System**: The glasses canvas uses a coordinate system with the origin (0, 0) at the **top-left corner**. The X-axis extends **rightward** (positive values increase to the right), and the Y-axis extends **downward** (positive values increase downward).

##### `createStartUpPageContainer(container: CreateStartUpPageContainer): Promise<StartUpPageCreateResult>`

Create startup page container. **This method must be called only once when first starting the glasses UI**, and cannot be called again afterwards (even if called, it will have no effect).

> **Important Notes**:
> - When creating multiple containers, **exactly one** container must have `isEventCapture=1` (all others must be `0`)
> - `containerTotalNum` has a **maximum value of 4** - you can create at most 4 containers (single or mixed types)
> - Image containers require calling `updateImageRawData` after creation to display actual content (see details below)

**Parameters**:
- `container: CreateStartUpPageContainer` - Container configuration object

**Returns**: `Promise<StartUpPageCreateResult>` - Creation result
- `0` = success
- `1` = invalid
- `2` = oversize
- `3` = outOfMemory

**Example**:
```typescript
import {
  CreateStartUpPageContainer,
  ListContainerProperty,
  TextContainerProperty,
  ImageContainerProperty,
  ListItemContainerProperty,
} from '@evenrealities/even_hub_sdk';

// Example: Create a container with list, text, and image
const listContainer: ListContainerProperty = {
  xPosition: 100,
  yPosition: 50,
  width: 200,
  height: 150,
  borderWidth: 2,
  borderColor: 5,
  borderRdaius: 5,
  paddingLength: 10,
  containerID: 1,
  containerName: 'list-1',
  itemContainer: {
    itemCount: 3,
    itemWidth: 0, // 0 = auto fill
    isItemSelectBorderEn: 1,
    itemName: ['Item 1', 'Item 2', 'Item 3'],
  },
  isEventCapture: 1,
};

const textContainer: TextContainerProperty = {
  xPosition: 100,
  yPosition: 220,
  width: 200,
  height: 50,
  borderWidth: 1,
  borderColor: 0,
  borderRdaius: 3,
  paddingLength: 5,
  containerID: 2,
  containerName: 'text-1',
  content: 'Hello World',
  isEventCapture: 0,
};

const imageContainer: ImageContainerProperty = {
  xPosition: 320,
  yPosition: 50,
  width: 100,
  height: 80,
  containerID: 3,
  containerName: 'img-1',
};

const container: CreateStartUpPageContainer = {
  containerTotalNum: 3,
  listObject: [listContainer],
  textObject: [textContainer],
  imageObject: [imageContainer],
};

const result = await bridge.createStartUpPageContainer(container);
if (result === 0) {
  console.log('Container created successfully');
  
  // If there are image containers, call updateImageRawData immediately after success to display image content
  await bridge.updateImageRawData({
    containerID: 3,
    containerName: 'img-1',
    imageData: [/* image data */],
  });
} else {
  console.error('Failed to create container:', result);
}
```

**Parameter Requirements**:
- See [Container Property Models](#container-property-models) section for detailed parameter constraints

> **Note on Image Containers** (applies to both `createStartUpPageContainer` and `rebuildPageContainer`): Unlike other container types (list and text), image containers do not require data to be provided during creation. After an image container is successfully created, it will only occupy a placeholder position on the screen. You must call `updateImageRawData` to refresh the view and display the actual image content.

##### `rebuildPageContainer(container: RebuildPageContainer): Promise<boolean>`

Rebuild page container. Used to update the current page or create a new page.

> **Important Notes**:
> - This method is functionally identical to `createStartUpPageContainer` with the same parameter structure
> - **Responsibility**: `createStartUpPageContainer` must be called only once when first starting the glasses UI, and cannot be called again afterwards; all subsequent page updates or new page creation must use `rebuildPageContainer`
> - For detailed information about parameter constraints, container configuration, example code, etc., please refer to the [`createStartUpPageContainer`](#createstartuppagecontainercontainer-createstartuppagecontainer-promisestartuppagecreateresult) section

**Parameters**:
- `container: RebuildPageContainer` - Container configuration object (same structure as `CreateStartUpPageContainer`)

**Returns**: `Promise<boolean>` - Whether the operation succeeded

**Example**:
```typescript
import { RebuildPageContainer } from '@evenrealities/even_hub_sdk';

const container: RebuildPageContainer = {
  containerTotalNum: 2,
  listObject: [/* ... ListContainerProperty[] */],
  textObject: [/* ... TextContainerProperty[] */],
  imageObject: [/* ... ImageContainerProperty[] */],
};

const success = await bridge.rebuildPageContainer(container);
if (success) {
  // If there are image containers, call updateImageRawData after rebuild to display image content
  await bridge.updateImageRawData({
    containerID: 3,
    containerName: 'img-1',
    imageData: [/* image data */],
  });
}
```

**Parameter Requirements**:
- Same as `createStartUpPageContainer`, see the [`createStartUpPageContainer`](#createstartuppagecontainercontainer-createstartuppagecontainer-promisestartuppagecreateresult) section for detailed parameter constraints

##### `updateImageRawData(data: ImageRawDataUpdate): Promise<ImageRawDataUpdateResult>`

Update image raw data.

**Parameters**:
- `data: ImageRawDataUpdate` - Image data update object

**Returns**: `Promise<ImageRawDataUpdateResult>` - Update result

**Example**:
```typescript
import { ImageRawDataUpdate } from '@evenrealities/even_hub_sdk';

const raw: Uint8Array = new Uint8Array([1, 2, 3]);

const data: ImageRawDataUpdate = {
  containerID: 1,
  containerName: 'img-1',
  imageData: raw, // SDK will automatically convert Uint8Array/ArrayBuffer to number[]
};

const result = await bridge.updateImageRawData(data);
```

**Note**: `imageData` is recommended to be passed as `number[]`. If `Uint8Array` or `ArrayBuffer` is passed, the SDK will automatically convert it to `number[]` during serialization. You can also pass a base64 string.

> **Important Notes**:
> 1. Images should preferably use simple, single-color schemes
> 2. Image transmission must not be sent concurrently - use a queue mode instead, ensuring the previous image transmission returns successfully before sending the next one
> 3. Due to limited memory resources on the glasses, avoid sending images too frequently

##### `textContainerUpgrade(container: TextContainerUpgrade): Promise<boolean>`

Text container upgrade.

**Parameters**:
- `container: TextContainerUpgrade` - Text container upgrade configuration

**Returns**: `Promise<boolean>` - Whether the operation succeeded

**Example**:
```typescript
import { TextContainerUpgrade } from '@evenrealities/even_hub_sdk';

const container: TextContainerUpgrade = {
  containerID: 1,
  containerName: 'text-1', // max 16 characters
  contentOffset: 0,
  contentLength: 100,
  content: 'Your text content here', // max 2000 characters
};

const success = await bridge.textContainerUpgrade(container);
```

**Parameter Requirements**:
- `containerName`: Maximum 16 characters
- `content`: Maximum 2000 characters

##### `audioControl(isOpen: boolean): Promise<boolean>`

EvenHub MIC control (audio control). Opens or closes the microphone.

> **Prerequisite**: You must call `createStartUpPageContainer` successfully before opening or closing the microphone.

**Parameters**:
- `isOpen: boolean` - `true` to open the microphone, `false` to close it

**Returns**: `Promise<boolean>` - `true` on success, `false` on failure

**Example**:
```typescript
// Open microphone
await bridge.audioControl(true);

// Close microphone
await bridge.audioControl(false);
```

##### `shutDownPageContainer(exitMode?: number): Promise<boolean>`

Shut down page container.

**Parameters**:
- `exitMode?: number` - Exit mode (optional, defaults to 0)
  - `0` = Exit immediately
  - `1` = Show foreground interaction layer, let user decide whether to exit

**Returns**: `Promise<boolean>` - Whether the operation succeeded

**Example**:
```typescript
// Exit immediately
await bridge.shutDownPageContainer(0);

// Show interaction layer
await bridge.shutDownPageContainer(1);
```

#### EvenHub Event Listening Methods

##### `onEvenHubEvent(callback: (event: EvenHubEvent) => void): () => void`

Listen to EvenHub event pushes.

**Parameters**:
- `callback: (event: EvenHubEvent) => void` - Event callback function

**Returns**: `() => void` - Unsubscribe function

**Example**:
```typescript
const unsubscribe = bridge.onEvenHubEvent((event) => {
  if (event.listEvent) {
    // Handle list event
  } else if (event.textEvent) {
    // Handle text event
  } else if (event.sysEvent) {
    // Handle system event
  } else if (event.audioEvent) {
    // Handle audio event (PCM bytes from host)
    const pcm = event.audioEvent.audioPcm; // Uint8Array
  }
});

// Unsubscribe
unsubscribe();
```

#### Generic Methods

##### `callEvenApp(method: EvenAppMethod | string, params?: any): Promise<any>`

Generic method for calling Even App native functionality.

**Parameters**:
- `method: EvenAppMethod | string` - Method name (can use enum or string)
- `params?: any` - Method parameters (optional)

**Returns**: `Promise<any>` - Even App method execution result

**Example**:
```typescript
import { EvenAppMethod } from '@evenrealities/even_hub_sdk';

// Using enum
const result = await bridge.callEvenApp(EvenAppMethod.GetUserInfo);

// Using string
const result = await bridge.callEvenApp('getUserInfo');
```

---

### Data Models

##### `callEvenApp(method: EvenAppMethod | string, params?: any): Promise<any>`

Generic method for calling Even App native functionality.

**Parameters**:
- `method: EvenAppMethod | string` - Method name (can use enum or string)
- `params?: any` - Method parameters (optional)

**Returns**: `Promise<any>` - Even App method execution result

**Example**:
```typescript
import { EvenAppMethod } from '@evenrealities/even_hub_sdk';

// Using enum
const result = await bridge.callEvenApp(EvenAppMethod.GetUserInfo);

// Using string
const result = await bridge.callEvenApp('getUserInfo');
```

### Data Models

#### UserInfo

User information model.

**Properties**:
- `uid: number` - User ID
- `name: string` - Username
- `avatar: string` - User avatar URL
- `country: string` - User country

**Methods**:
- `toJson(): Record<string, any>` - Convert to JSON object

**Static Methods**:
- `fromJson(json: any): UserInfo` - Create UserInfo instance from JSON
- `createDefault(): UserInfo` - Create default UserInfo instance

#### DeviceInfo

Device information model.

**Properties**:
- `readonly model: DeviceModel` - Device model (read-only)
- `readonly sn: string` - Device serial number (read-only)
- `status: DeviceStatus` - Device status

**Methods**:
- `updateStatus(status: DeviceStatus): void` - Update device status (only updates when `status.sn === device.sn`)
- `isGlasses(): boolean` - Check if device is glasses
- `isRing(): boolean` - Check if device is ring
- `toJson(): Record<string, any>` - Convert to JSON object

**Static Methods**:
- `fromJson(json: any): DeviceInfo` - Create DeviceInfo instance from JSON

**Note**: `model` and `sn` cannot be modified once created; only `status` can be updated.

#### DeviceStatus

Device status model.

**Properties**:
- `readonly sn: string` - Device serial number (read-only)
- `connectType: DeviceConnectType` - Connection status
- `isWearing?: boolean` - Whether wearing
- `batteryLevel?: number` - Battery level (0-100)
- `isCharging?: boolean` - Whether charging
- `isInCase?: boolean` - Whether in charging case

**Methods**:
- `toJson(): Record<string, any>` - Convert to JSON object
- `isNone(): boolean` - Check if status is not initialized
- `isConnected(): boolean` - Check if device is connected
- `isConnecting(): boolean` - Check if device is connecting
- `isDisconnected(): boolean` - Check if device is disconnected
- `isConnectionFailed(): boolean` - Check if connection failed

**Static Methods**:
- `fromJson(json: any): DeviceStatus` - Create DeviceStatus instance from JSON
- `createDefault(sn?: string): DeviceStatus` - Create default DeviceStatus instance

#### EvenHubEvent

EvenHub event model.

**Properties**:
- `listEvent?: List_ItemEvent` - List event (if exists)
- `textEvent?: Text_ItemEvent` - Text event (if exists)
- `sysEvent?: Sys_ItemEvent` - System event (if exists)
- `audioEvent?: { audioPcm: Uint8Array }` - Audio event (PCM bytes; if exists). PCM: **dtUs** 10000 µs, **srHz** 16kHz, **40 bytes per frame**, **little-endian**.
- `jsonData?: Record<string, any>` - Raw JSON data (optional, useful for debugging/replay)

**Usage**:
Developers only need to check which property is not empty to use the corresponding event object:

```typescript
if (event.listEvent) {
  // Handle listEvent
} else if (event.textEvent) {
  // Handle textEvent
} else if (event.sysEvent) {
  // Handle sysEvent
} else if (event.audioEvent) {
  // Handle audio event (PCM bytes)
  const pcm = event.audioEvent.audioPcm;
}
```

#### Container Property Models

These models define the properties for different container types used in EvenHub.

##### ListContainerProperty

List container configuration.

**Properties**:
- `xPosition?: number` - X position (range: 0-576)
- `yPosition?: number` - Y position (range: 0-288)
- `width?: number` - Width (range: 0-576)
- `height?: number` - Height (range: 0-288)
- `borderWidth?: number` - Border width (range: 0-5)
- `borderColor?: number` - Border color (range: 0-15)
- `borderRdaius?: number` - Border radius (range: 0-10)
- `paddingLength?: number` - Padding length (range: 0-32)
- `containerID?: number` - Container ID (random)
- `containerName?: string` - Container name (max 16 characters)
- `itemContainer?: ListItemContainerProperty` - Item container configuration
- `isEventCapture?: number` - Event capture flag (0 or 1)

##### ListItemContainerProperty

List item container configuration.

**Properties**:
- `itemCount?: number` - Item count (range: 1-20)
- `itemWidth?: number` - Item width (0 = auto fill length, other = fixed length set by user)
- `isItemSelectBorderEn?: number` - Item select border enable (1 = show outer border when selected, 0 = hidden)
- `itemName?: string[]` - Item names (max 20 items, max 64 characters each)

##### TextContainerProperty

Text container configuration.

**Properties**:
- `xPosition?: number` - X position (range: 0-576)
- `yPosition?: number` - Y position (range: 0-288)
- `width?: number` - Width (range: 0-576)
- `height?: number` - Height (range: 0-288)
- `borderWidth?: number` - Border width (range: 0-5)
- `borderColor?: number` - Border color (range: 0-16)
- `borderRdaius?: number` - Border radius (range: 0-10)
- `paddingLength?: number` - Padding length (range: 0-32)
- `containerID?: number` - Container ID (random)
- `containerName?: string` - Container name (max 16 characters)
- `isEventCapture?: number` - Event capture flag (0 or 1). On a page, only one container can handle events at the end.
- `content?: string` - Content text (max 1000 characters). During startup phase, try to minimize data length to meet transmission efficiency requirements.

##### TextContainerUpgrade

Text container upgrade configuration.

**Properties**:
- `containerID?: number` - Container ID (random)
- `containerName?: string` - Container name (max 16 characters)
- `contentOffset?: number` - Content offset
- `contentLength?: number` - Content length
- `content?: string` - Content text (max 2000 characters)

##### ImageContainerProperty

Image container configuration.

**Properties**:
- `xPosition?: number` - X position (range: 0-576)
- `yPosition?: number` - Y position (range: 0-288)
- `width?: number` - Width (range: 20-200)
- `height?: number` - Height (range: 20-100)
- `containerID?: number` - Container ID (random)
- `containerName?: string` - Container name (max 16 characters)

**Note**: The image package data volume is too large. Image content cannot be transmitted during the startup stage.

##### ImageRawDataUpdate

Image raw data update model.

**Properties**:
- `containerID?: number` - Container ID
- `containerName?: string` - Container name
- `imageData?: number[] | string | Uint8Array | ArrayBuffer` - Image data (recommended: `number[]`, can also be base64 string, Uint8Array, or ArrayBuffer)

**Methods**:
- `toJson(): Record<string, any>` - Convert to JSON object

**Static Methods**:
- `fromJson(json: any): ImageRawDataUpdate` - Create ImageRawDataUpdate instance from JSON

**Note**: `imageData` is recommended to be passed as `number[]`. If `Uint8Array` or `ArrayBuffer` is passed, the SDK will automatically convert it to `number[]` during serialization. You can also pass a base64 string.

##### CreateStartUpPageContainer

Startup page container creation model.

**Properties**:
- `containerTotalNum?: number` - Total number of containers
- `listObject?: ListContainerProperty[]` - List of list containers
- `textObject?: TextContainerProperty[]` - List of text containers
- `imageObject?: ImageContainerProperty[]` - List of image containers

**Methods**:
- `toJson(): Record<string, any>` - Convert to JSON object

**Static Methods**:
- `fromJson(json: any): CreateStartUpPageContainer` - Create CreateStartUpPageContainer instance from JSON
- `toJson(model?: CreateStartUpPageContainer | Record<string, any>): Record<string, any>` - Convert to JSON

##### RebuildPageContainer

Page container rebuild model (same structure as `CreateStartUpPageContainer`).

**Properties**:
- `containerTotalNum?: number` - Total number of containers
- `listObject?: ListContainerProperty[]` - List of list containers
- `textObject?: TextContainerProperty[]` - List of text containers
- `imageObject?: ImageContainerProperty[]` - List of image containers

**Methods**:
- `toJson(): Record<string, any>` - Convert to JSON object

**Static Methods**:
- `fromJson(json: any): RebuildPageContainer` - Create RebuildPageContainer instance from JSON
- `toJson(model?: RebuildPageContainer | Record<string, any>): Record<string, any>` - Convert to JSON

**Note**: Use `rebuildPageContainer` to rebuild pages, even for the first page. Do not use `createStartUpPageContainer` again after the initial creation.

### Enum Types

#### EvenAppMethod

Even App method enum.

```typescript
enum EvenAppMethod {
  GetUserInfo = 'getUserInfo',
  GetGlassesInfo = 'getGlassesInfo',
  SetLocalStorage = 'setLocalStorage',
  GetLocalStorage = 'getLocalStorage',
  CreateStartUpPageContainer = 'createStartUpPageContainer',
  RebuildPageContainer = 'rebuildPageContainer',
  UpdateImageRawData = 'updateImageRawData',
  TextContainerUpgrade = 'textContainerUpgrade',
  AudioControl = 'audioControl',
  ShutDownPageContainer = 'shutDownPageContainer',
}
```

#### DeviceConnectType

Device connection status enum.

```typescript
enum DeviceConnectType {
  None = 'none',
  Connecting = 'connecting',
  Connected = 'connected',
  Disconnected = 'disconnected',
  ConnectionFailed = 'connectionFailed',
}
```

#### StartUpPageCreateResult

Startup page creation result enum.

```typescript
enum StartUpPageCreateResult {
  Success = 0,
  Invalid = 1,
  Oversize = 2,
  OutOfMemory = 3,
}
```

## 🔧 Advanced Usage

### Update Device Status

`DeviceInfo`'s `model` and `sn` cannot be modified once created; only `status` can be updated.

```typescript
const device = await bridge.getDeviceInfo();
const status = await getDeviceStatus(); // Get status from elsewhere

if (device && status) {
  // Only updates when status.sn === device.sn
  device.updateStatus(status);
}
```

### Receiving Push Events from App

The App can push notifications to Web through JS bridge. The SDK will prioritize using `window._listenEvenAppMessage(...)` to receive.

#### Device Status Changes

The App can push device status changes with the following message format:

```javascript
{
  type: 'listen_even_app_data',
  method: 'deviceStatusChanged',
  data: {
    sn: 'DEVICE_SN',
    connectType: 'connected',
    isWearing: true,
    batteryLevel: 80,
    isCharging: false,
    isInCase: false
  }
}
```

#### EvenHub Events

The App can push EvenHub events with the following message format:

```javascript
{
  type: 'listen_even_app_data',
  method: 'evenHubEvent',
  data: {
    type: 'listEvent', // or textEvent / sysEvent / audioEvent
    jsonData: {
      containerID: 1,
      currentSelectItemName: 'item1',
      // ... other fields
    }
  }
}
```

For **audioEvent**, the host sends PCM bytes (e.g. from `onAudioData`). The SDK parses `jsonData.audioPcm` (as `number[]` or base64 string) into `event.audioEvent.audioPcm` (`Uint8Array`). PCM: **dtUs** 10000 µs, **srHz** 16kHz, **40 bytes per frame**, **little-endian**.

The SDK is compatible with the following data formats:
- `data: { type: 'listEvent', jsonData: {...} }`
- `data: { type: 'list_event', data: {...} }`
- `data: [ 'list_event', {...} ]`
- `data: { type: 'audioEvent', jsonData: { audioPcm: [...] } }`

### EvenHub OS Event Models

The SDK includes basic models for OS→App events:

- `List_ItemEvent` - List item event
- `Text_ItemEvent` - Text item event
- `Sys_ItemEvent` - System item event
- `OsEventTypeList` - OS event type list (for system event type enumeration)

These models are used by `evenHubEvent`:
- `listEvent` → `List_ItemEvent`
- `textEvent` → `Text_ItemEvent`
- `sysEvent` → `Sys_ItemEvent`
- `audioEvent` → `{ audioPcm: Uint8Array }` (PCM: dtUs 10000 µs, srHz 16kHz, 40 bytes/frame, little-endian)

#### List_ItemEvent

List item event model.

**Properties**:
- `containerID?: number` - Container ID
- `containerName?: string` - Container name
- `currentSelectItemName?: string` - Currently selected item name
- `currentSelectItemIndex?: number` - Currently selected item index
- `eventType?: OsEventTypeList` - Event type

#### Text_ItemEvent

Text item event model.

**Properties**:
- `containerID?: number` - Container ID
- `containerName?: string` - Container name
- `eventType?: OsEventTypeList` - Event type

#### Sys_ItemEvent

System item event model.

**Properties**:
- `eventType?: OsEventTypeList` - Event type

**Note**: Currently, the SDK supports event types `listEvent`, `textEvent`, and `sysEvent`. Image events (`imgEvent`) are defined in the protocol but are not yet included in the current version's type definitions.

## 📝 Notes

1. **Bridge Initialization**: The SDK automatically initializes the bridge, but it's recommended to use `waitForEvenAppBridge()` to ensure the bridge is ready.

2. **Type Safety**: All interfaces provide complete TypeScript type definitions. It's recommended to use in TypeScript projects for the best developer experience.

3. **Event Listening**: Remember to unsubscribe from event listeners when components unmount to avoid memory leaks.

4. **Data Format**: EvenHub API uses camelCase naming, while also being compatible with different naming conventions (e.g., `List_Object`).

## 🤝 Contributing

Issues and Pull Requests are welcome!

## 📧 Contact

- **Author**: Whiskee
- **Email**: whiskee.chen@evenrealities.com

## 📜 Changelog

### 0.0.1

- Initial release
- Implemented basic bridge functionality
- Support for device information, user information, local storage
- Support for EvenHub protocol core interfaces
- Support for event listening mechanism

## 📄 License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

---

**Made with ❤️ by Even Realities**
