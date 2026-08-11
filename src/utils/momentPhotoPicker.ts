export type PickMomentPhotoResult =
  | {
      status: 'selected';
      uri: string;
    }
  | {
      status: 'cancelled' | 'permission-denied' | 'unavailable';
    };

export async function pickMomentPhotoFromLibrary(): Promise<PickMomentPhotoResult> {
  try {
    const ImagePicker = await import('expo-image-picker');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync(false);

    if (!permission.granted) {
      return { status: 'permission-denied' };
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      allowsMultipleSelection: false,
      mediaTypes: ['images'],
      quality: 0.92,
    });

    if (result.canceled || !result.assets[0]?.uri) {
      return { status: 'cancelled' };
    }

    return {
      status: 'selected',
      uri: result.assets[0].uri,
    };
  } catch {
    return { status: 'unavailable' };
  }
}
