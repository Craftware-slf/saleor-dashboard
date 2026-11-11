import { type Container } from "@dashboard/types";
import { Radio, TableCell } from "@material-ui/core";
import { type ReactNode } from "react";

import Checkbox from "../Checkbox";
import TableRowLink from "../TableRowLink";

// Craftware (Örninn FEAT-263): lets a dialog render more than the bare name in a row (the category
// dialog prefixes the category path). Defaults to the name, so other dialogs are unchanged.
export type ContainerLabelRenderer = (container: Container) => ReactNode;

const renderName: ContainerLabelRenderer = container => container.name;

interface SingleSelectionRowsProps {
  containers: Container[];
  selectedItemId: string;
  onSelect: (id: string) => void;
  renderLabel?: ContainerLabelRenderer;
}

export const SingleSelectionRows = ({
  containers,
  selectedItemId,
  onSelect,
  renderLabel = renderName,
}: SingleSelectionRowsProps) => (
  <>
    {containers?.map(container => {
      const isSelected = selectedItemId === container.id;

      return (
        <TableRowLink
          key={container.id}
          data-test-id="dialog-row"
          onClick={() => onSelect(container.id)}
        >
          <TableCell padding="checkbox">
            <Radio
              checked={isSelected}
              onChange={() => onSelect(container.id)}
              value={container.id}
              name="container-selection"
            />
          </TableCell>
          <TableCell style={{ width: "100%" }} data-test-id={container.name}>
            {renderLabel(container)}
          </TableCell>
        </TableRowLink>
      );
    })}
  </>
);

interface MultiSelectionRowsProps {
  containers: Container[];
  isSelected: (id: string) => boolean;
  onToggle: (item: Container) => void;
  renderLabel?: ContainerLabelRenderer;
}

export const MultiSelectionRows = ({
  containers,
  isSelected,
  onToggle,
  renderLabel = renderName,
}: MultiSelectionRowsProps) => (
  <>
    {containers?.map(container => (
      <TableRowLink key={container.id} data-test-id="dialog-row">
        <TableCell padding="checkbox">
          <Checkbox checked={isSelected(container.id)} onChange={() => onToggle(container)} />
        </TableCell>
        <TableCell style={{ width: "100%" }} data-test-id={container.name}>
          {renderLabel(container)}
        </TableCell>
      </TableRowLink>
    ))}
  </>
);
