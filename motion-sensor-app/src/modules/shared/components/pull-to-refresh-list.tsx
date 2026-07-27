import { useCallback, useRef, useState } from "react";
import { FlatList, FlatListProps, RefreshControl } from "react-native";
import Animated from "react-native-reanimated";

const AnimatedFlatList = Animated.createAnimatedComponent(
  FlatList,
) as unknown as typeof FlatList;

type PullToRefreshListProps<T> = Omit<
  FlatListProps<T>,
  "onScroll" | "refreshControl"
> & {
  onRefresh: () => Promise<unknown> | unknown;
  lastUpdated?: Date | null;
};

export function PullToRefreshList<T>({
  onRefresh,
  lastUpdated = null,
  ...flatListProps
}: PullToRefreshListProps<T>) {
  const [refreshing, setRefreshing] = useState(false);
  const listRef = useRef<FlatList<T>>(null);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  return (
    <AnimatedFlatList
      ref={listRef}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#a1a1aa"
          colors={["#a1a1aa"]}
          progressBackgroundColor="#18181b"
        />
      }
      {...flatListProps}
    />
  );
}
