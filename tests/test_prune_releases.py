import importlib.util
import os
from pathlib import Path
import tempfile
import unittest


spec = importlib.util.spec_from_file_location("prune_releases", Path(__file__).resolve().parents[1] / "deploy/prune-releases.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

IDS = ["20260901T000000Z", "20260910T000000Z", "20260920T000000Z", "20260930T000000Z", "20261006T000000Z"]


def make_root(directory, current, previous_targets=None):
    root = Path(directory)
    for release in IDS:
        (root / "releases" / release / "assets").mkdir(parents=True)
        (root / "deployments" / release).mkdir(parents=True)
    for deployment, target in (previous_targets or {}).items():
        (root / "deployments" / deployment / "previous-target.txt").write_text(f"releases/{target}\n")
    (root / "shared/assets").mkdir(parents=True)
    os.symlink(f"releases/{current}", root / "current")
    return root


class PruneReleasesTest(unittest.TestCase):
    def test_keeps_newest_current_and_rollback_targets(self):
        with tempfile.TemporaryDirectory() as directory:
            root = make_root(directory, current=IDS[-1], previous_targets={IDS[-1]: IDS[0]})
            result = module.plan(root, keep=2)
            self.assertEqual(result["keptReleases"], [IDS[0], IDS[3], IDS[4]])
            self.assertEqual(result["deleteReleases"], [IDS[1], IDS[2]])
            self.assertEqual(result["deleteDeployments"], [IDS[1], IDS[2]])

    def test_older_packages_rollback_targets_do_not_pin_releases(self):
        with tempfile.TemporaryDirectory() as directory:
            chain = {IDS[index]: IDS[index - 1] for index in range(1, len(IDS))}
            root = make_root(directory, current=IDS[-1], previous_targets=chain)
            result = module.plan(root, keep=3)
            self.assertEqual(result["keptReleases"], IDS[-3:])
            self.assertEqual(result["deleteReleases"], IDS[:2])
            self.assertEqual(result["deleteDeployments"], IDS[:2])

    def test_never_deletes_current_after_a_rollback(self):
        with tempfile.TemporaryDirectory() as directory:
            root = make_root(directory, current=IDS[1])
            result = module.plan(root, keep=2)
            self.assertIn(IDS[1], result["keptReleases"])
            self.assertNotIn(IDS[1], result["deleteReleases"])

    def test_dry_run_by_default_and_apply_leaves_shared(self):
        with tempfile.TemporaryDirectory() as directory:
            root = make_root(directory, current=IDS[-1])
            result = module.plan(root, keep=3)
            self.assertTrue((root / "releases" / IDS[0]).exists())
            module.apply(root, result)
            self.assertFalse((root / "releases" / IDS[0]).exists())
            self.assertFalse((root / "deployments" / IDS[1]).exists())
            self.assertTrue((root / "releases" / IDS[-1]).exists())
            self.assertTrue((root / "shared/assets").exists())

    def test_refuses_unsafe_configurations(self):
        with tempfile.TemporaryDirectory() as directory:
            root = make_root(directory, current=IDS[-1])
            with self.assertRaises(ValueError):
                module.plan(root, keep=1)
            (root / "current").unlink()
            with self.assertRaises(ValueError):
                module.plan(root, keep=3)


if __name__ == "__main__":
    unittest.main()
