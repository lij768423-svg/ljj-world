import importlib.util
from pathlib import Path
import tempfile
import unittest


spec = importlib.util.spec_from_file_location("retain_assets", Path(__file__).resolve().parents[1] / "deploy/retain-assets.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class RetainedAssetsTest(unittest.TestCase):
    def test_preserves_only_immutable_assets_and_is_idempotent(self):
        with tempfile.TemporaryDirectory() as directory:
            release = Path(directory) / "release"
            shared = Path(directory) / "shared"
            assets = release / "assets"
            assets.mkdir(parents=True)
            (assets / "index-AbCd012_.js").write_text("export default 1;")
            (assets / "portrait.webp").write_text("not hashed")
            (assets / "grok2api-egress-enhancements.png").write_text("not hashed")
            (assets / "secret.env").write_text("not public")
            self.assertEqual(module.retain_assets(release, shared), 1)
            self.assertEqual(module.retain_assets(release, shared), 0)
            self.assertEqual((shared / "assets/index-AbCd012_.js").read_text(), "export default 1;")
            self.assertFalse((shared / "assets/portrait.webp").exists())
            self.assertFalse((shared / "assets/grok2api-egress-enhancements.png").exists())
            self.assertFalse((shared / "assets/secret.env").exists())

    def test_preserves_fingerprinted_video(self):
        with tempfile.TemporaryDirectory() as directory:
            release = Path(directory) / "release"
            shared = Path(directory) / "shared"
            loops = release / "assets/portrait-loop"
            loops.mkdir(parents=True)
            (loops / "portrait-gentle-blink-d07eb2b4cbd6.webm").write_text("webm")
            (loops / "portrait-dark-native-a74192166a14.mp4").write_text("mp4")
            (loops / "portrait-unhashed.webm").write_text("not hashed")
            self.assertEqual(module.retain_assets(release, shared), 2)
            self.assertTrue((shared / "assets/portrait-loop/portrait-gentle-blink-d07eb2b4cbd6.webm").exists())
            self.assertTrue((shared / "assets/portrait-loop/portrait-dark-native-a74192166a14.mp4").exists())
            self.assertFalse((shared / "assets/portrait-loop/portrait-unhashed.webm").exists())

    def test_rejects_hash_collision_without_overwriting(self):
        with tempfile.TemporaryDirectory() as directory:
            release = Path(directory) / "release"
            shared = Path(directory) / "shared"
            (release / "assets").mkdir(parents=True)
            asset = release / "assets/index-AbCd012_.js"
            asset.write_text("first")
            module.retain_assets(release, shared)
            asset.write_text("changed")
            with self.assertRaises(ValueError):
                module.retain_assets(release, shared)
            self.assertEqual((shared / "assets/index-AbCd012_.js").read_text(), "first")


if __name__ == "__main__":
    unittest.main()
