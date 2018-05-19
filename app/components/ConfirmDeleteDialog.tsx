import * as React from "react";
import * as fs from "fs";
import * as Path from "path";
import * as ReactModal from "react-modal";
import "./ConfirmDeleteDialog.scss";
import { locate } from "../crossPlatformUtilities";

// tslint:disable-next-line:no-empty-interface
interface IProps {}
interface IState {
  isOpen: boolean;
  path?: string;
  deleteAction?: (path: string) => void;
}

export default class ConfirmDeleteDialog extends React.Component<
  IProps,
  IState
> {
  private static singleton: ConfirmDeleteDialog;

  constructor(props: IProps) {
    super(props);
    this.state = { isOpen: false };
    ConfirmDeleteDialog.singleton = this;
  }
  private handleCloseModal(doDelete: boolean) {
    if (doDelete && this.state.deleteAction && this.state.path) {
      this.state.deleteAction(this.state.path);
    }
    this.setState({ isOpen: false, deleteAction: () => {} });
  }

  public static async show(path: string, deleteAction: (path: string) => void) {
    const fileName = Path.basename(path);
    ConfirmDeleteDialog.singleton.setState({
      path: fileName,
      isOpen: true,
      deleteAction
    });
  }
  public render() {
    return (
      <ReactModal
        ariaHideApp={false}
        className="confirmDelete"
        isOpen={this.state.isOpen}
        shouldCloseOnOverlayClick={false}
      >
        <div className={"dialogTitle"}>Confirm Delete</div>
        <div className="dialogContent">
          <div className="row">
            <img src={locate("assets/trash.png")} />
            <h1>{`${this.state.path} will be moved to the Trash`}</h1>
          </div>
          <div className={"okCancelButtonRow"}>
            {/* actual order of these will be platform-specific, controlled by
          app.global.scss */}
            <button onClick={() => this.handleCloseModal(false)}>Cancel</button>
            <button
              id="deleteButton"
              onClick={() => this.handleCloseModal(true)}
            >
              Delete
            </button>
          </div>
        </div>
      </ReactModal>
    );
  }
}
