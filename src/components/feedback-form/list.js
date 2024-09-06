import React, { useCallback } from 'react';

export const List = ({
  data = [],
  render,
  beforeItemsRender,
  afterItemsRender,
  onItemClick,
  ...rest
}) => {
  const getItemPropsCallback = useCallback(
    (postfix) => ({
      'data-element-name': `item:${postfix}`,
    }),
    []
  );

  return (
    <>
      {beforeItemsRender ? beforeItemsRender() : null}
      {data?.map((item, index) =>
        render({
          index,
          item,
          length: data.length,
          getItemProps: getItemPropsCallback,
          onItemClick,
          ...rest,
        })
      )}
      {afterItemsRender ? afterItemsRender() : null}
    </>
  );
};
