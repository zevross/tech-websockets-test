import { useResize } from "@/hooks/use-resize";
import { ReactNode, RefObject } from "react";

interface ScaleContainerProps {
  maxLongSide: number;
  children: (arg: {
    ref: RefObject<HTMLDivElement | null>;
    styles: {
      width: number;
      height: number;
      maxWidth: number;
      maxHeight: number;
    };
  }) => ReactNode;
}

export const ScaleContainer = (props: ScaleContainerProps) => {
  const { containerRef, size: containerSize } = useResize();
  const { containerRef: childRef, size: childSize } = useResize();

  const aspect =
    containerSize.height > 0 ? containerSize.width / containerSize.height : 1;
  const childMaxWidth =
    aspect >= 1 ? props.maxLongSide : props.maxLongSide * aspect;
  const childMaxHeight =
    aspect >= 1 ? props.maxLongSide / aspect : props.maxLongSide;

  const ratio = childSize.width > 0 ? containerSize.width / childSize.width : 1;
  console.log(ratio);
  console.log(childMaxWidth, childMaxHeight);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        transformOrigin: "0 0",
        transform: `scale(${ratio})`,
      }}
    >
      {props.children({
        ref: childRef,
        styles: {
          width: containerSize.width,
          height: containerSize.height,
          maxWidth: childMaxWidth,
          maxHeight: childMaxHeight,
        },
      })}
    </div>
  );
};
