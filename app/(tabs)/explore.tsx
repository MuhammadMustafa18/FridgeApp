import {
  deleteItem,
  deleteRecipe,
  getItems,
  getRecipes,
  updateItemQuantity
} from "@/services/db";
import { Item, Recipe } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function TabTwoScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const router = useRouter();

  // Edit Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editName, setEditName] = useState("");
  const [editQuantity, setEditQuantity] = useState("1");
  const [savingObj, setSavingObj] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadItems();
      loadRecipes();
    }, [])
  );

  const loadItems = async () => {
    const data = await getItems("confirmed");
    setItems(data);
  };

  const loadRecipes = async () => {
    const data = await getRecipes();
    setRecipes(data);
  };

  const handleDeleteItem = async (id: number) => {
    try {
      await deleteItem(id);
      await loadItems();
    } catch (e) {
      Alert.alert("Error", "Failed to delete item");
    }
  };

  const handleDeleteRecipe = async (id: number) => {
    try {
      await deleteRecipe(id);
      await loadRecipes();
    } catch (e) {
      Alert.alert("Error", "Failed to delete recipe");
    }
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditQuantity(item.quantity.toString());
    setEditModalVisible(true);
  };

  const handleSaveChanges = async () => {
    if (!editingItem) return;
    if (!editName.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }
    setSavingObj(true);
    try {
      const qty = parseInt(editQuantity) || 0;
      await updateItemQuantity(editingItem.id, qty);
      await loadItems();
      setEditModalVisible(false);
    } catch (e) {
      Alert.alert("Error", "Failed to update item");
    } finally {
      setSavingObj(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Spacer for status bar area / top visual */}
        <View style={{ height: 60, backgroundColor: "#000" }} />

        <View style={styles.sheetContainer}>
          <Text style={styles.pageTitle}>Inventory</Text>

          {/* Grid */}
          <View style={styles.itemsGrid}>
            {items.map((item) => (
              <View key={item.id} style={styles.itemWrapper}>
                <View style={styles.imageBox}>
                  <TouchableOpacity
                    style={styles.deleteBadge}
                    onPress={() => handleDeleteItem(item.id)}
                  >
                    <Ionicons name="trash-outline" size={12} color="white" />
                  </TouchableOpacity>

                  <Image
                    source={{ uri: item.image_url || "https://via.placeholder.com/150" }}
                    style={styles.itemImage}
                  />

                  <TouchableOpacity
                    style={styles.editOverlay}
                    onPress={() => openEditModal(item)}
                  >
                    <Ionicons name="pencil" size={12} color="#333" />
                    <Text style={styles.editText}>Edit</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.qtyContainer}>
                    <Ionicons name="cube-outline" size={12} color="#999" />
                    <Text style={styles.itemQty}>{item.quantity}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
          {items.length === 0 && (
            <Text style={styles.emptyText}>No items in inventory.</Text>
          )}

          {/* Saved Recipes */}
          <Text style={styles.sectionTitle}>Saved Recipes</Text>

          <View style={styles.recipeList}>
            {recipes.map((recipe, i) => (
              <TouchableOpacity
                key={recipe.id}
                style={styles.recipeCard}
                onPress={() => router.push({
                  pathname: "/recipe/[id]",
                  params: {
                    id: i,
                    name: recipe.name,
                    ingredients: recipe.ingredients,
                    image_url: recipe.image_url,
                    how_to_cook: recipe.how_to_cook
                  }
                })}
              >
                <View style={styles.recipeImageWrapper}>
                  {recipe.image_url ? (
                    <Image source={{ uri: recipe.image_url }} style={styles.recipeImage} />
                  ) : (
                    <View style={[styles.recipeImage, { backgroundColor: '#ddd' }]} />
                  )}
                </View>

                <View style={styles.recipeContent}>
                  <View style={styles.recipeHeader}>
                    <Text style={styles.recipeName}>{recipe.name}</Text>
                    <TouchableOpacity onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteRecipe(recipe.id);
                    }}>
                      <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.recipeIngredients} numberOfLines={2}>
                    Ingredients: {recipe.ingredients}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          {recipes.length === 0 && (
            <Text style={styles.emptyText}>No recipes saved.</Text>
          )}

          <TouchableOpacity style={styles.viewMoreButton}>
            <Text style={styles.viewMoreText}>View More</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Item</Text>

            <Text style={styles.label}>Item Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: '#eee' }]}
              value={editName}
              editable={false}
            />

            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              value={editQuantity}
              onChangeText={setEditQuantity}
              keyboardType="numeric"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.buttonTextCancel}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonSave]}
                onPress={handleSaveChanges}
                disabled={savingObj}
              >
                {savingObj ? <ActivityIndicator color="white" /> : <Text style={styles.buttonTextSave}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const { width, height } = Dimensions.get("window");
const CARD_GAP = 12;
const CARD_WIDTH = (width - 40 - CARD_GAP * 2) / 3;

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
    backgroundColor: "#F2F2F2",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    paddingTop: 30,
    minHeight: height,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginBottom: 20,
  },
  itemsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_GAP,
    marginBottom: 30,
  },
  itemWrapper: {
    width: CARD_WIDTH,
    marginBottom: 8,
  },
  imageBox: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    backgroundColor: "white",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  deleteBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "#FF5252",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  itemImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  editText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#333",
  },
  itemInfo: {
    alignItems: 'flex-start',
    paddingHorizontal: 2,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  itemQty: {
    fontSize: 12,
    color: "#999",
    fontWeight: '500',
  },
  emptyText: {
    color: "#888",
    width: "100%",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 20,
    fontStyle: "italic",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 16,
    marginTop: 10,
  },
  recipeList: {
    flexDirection: "column",
    gap: 20,
  },
  recipeCard: {
    backgroundColor: "transparent",
    marginBottom: 10,
  },
  recipeImageWrapper: {
    width: "100%",
    height: 180,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "white",
    marginBottom: 12,
  },
  recipeImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  recipeContent: {
    paddingHorizontal: 4,
  },
  recipeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  recipeIngredients: {
    fontSize: 14,
    color: "#666",
  },
  viewMoreButton: {
    backgroundColor: "#1A1A1A",
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 30,
    marginBottom: 40,
  },
  viewMoreText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: "#FAFAFA",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonCancel: {
    backgroundColor: "#F5F5F5",
  },
  buttonSave: {
    backgroundColor: "#1A1A1A",
  },
  buttonTextCancel: {
    color: "#666",
    fontWeight: "600",
    fontSize: 16,
  },
  buttonTextSave: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});
